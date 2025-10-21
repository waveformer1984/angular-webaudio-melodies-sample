import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FirebaseFunctionsService } from '../firebase-functions.service';
import { VoiceSynthesizer } from '../voice-synthesis';

declare var webkitSpeechRecognition: any;

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

@Component({
    selector: 'app-bot-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="chat-popup" [style.display]="isOpen ? 'flex' : 'none'">
            <div class="chat-header">
                <h4 class="bot-nickname">{{ botNickname }}</h4>
                <button class="close-btn" (click)="onClose()">&times;</button>
            </div>
            <div class="chat-history">
                <div *ngFor="let msg of messages" class="chat-message" [ngClass]="msg.sender">
                    <p>{{ msg.text }}</p>
                </div>
                <div *ngIf="isBotTyping" class="chat-message bot typing">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </div>
            <div class="chat-input-area">
                <textarea [(ngModel)]="userInput" (keyup.enter)="sendMessage()" placeholder="Type a message..."></textarea>
                <button (click)="sendMessage()" [disabled]="!userInput">Send</button>
                <button class="voice-btn" (click)="toggleVoiceRecognition()" [ngClass]="{ 'listening': isListening }">
                    {{ isListening ? 'Listening...' : '🎤' }}
                </button>
            </div>
        </div>
    `,
    styles: [`
        .chat-popup {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 450px;
            background-color: var(--control-bg-color, #2c2c2e);
            border: 1px solid var(--border-color, #444);
            border-radius: 8px;
            flex-direction: column;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
        }

        .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background-color: var(--secondary-color, #3a3a3c);
            border-bottom: 1px solid var(--border-color, #444);
        }

        .bot-nickname {
            margin: 0;
            color: var(--text-color, #fff);
            font-weight: bold;
        }

        .close-btn {
            background: none;
            border: none;
            color: var(--text-color, #fff);
            font-size: 1.5em;
            cursor: pointer;
        }

        .chat-history {
            flex-grow: 1;
            padding: 10px;
            overflow-y: auto;
        }

        .chat-message {
            margin-bottom: 10px;
        }

        .chat-message.user p {
            background-color: var(--primary-color, #0a84ff);
            color: var(--button-text-color, #fff);
            padding: 8px 12px;
            border-radius: 15px;
            display: inline-block;
            max-width: 80%;
            text-align: left;
        }

        .chat-message.bot p {
            background-color: var(--secondary-color, #3a3a3c);
            padding: 8px 12px;
            border-radius: 15px;
            display: inline-block;
            max-width: 80%;
            text-align: left;
        }

        .chat-message.bot.typing .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--text-color, #fff);
            animation: typing 1s infinite;
            margin: 0 2px;
        }
        
        @keyframes typing {
            0% { opacity: 0.2; }
            20% { opacity: 1; }
            100% { opacity: 0.2; }
        }

        .chat-input-area {
            display: flex;
            padding: 10px;
            border-top: 1px solid var(--border-color, #444);
        }

        textarea {
            flex-grow: 1;
            resize: none;
            background-color: var(--input-bg-color, #3a3a3c);
            color: var(--input-text-color, #fff);
            border: 1px solid var(--border-color, #444);
            border-radius: 4px;
        }

        button {
            margin-left: 8px;
            background-color: var(--button-bg-color, #5a5a5c);
            color: var(--button-text-color, #fff);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .voice-btn.listening {
            background-color: var(--accent-color, #ff9f0a);
        }
    `]
})
export class BotChatComponent implements OnInit, OnDestroy {
    @Input() botId!: string;
    @Input() botNickname: string = 'Rezonette Bot';
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();

    messages: ChatMessage[] = [];
    userInput: string = '';
    isBotTyping: boolean = false;
    isListening: boolean = false;

    private voiceSynth: VoiceSynthesizer;
    private recognition: any;

    constructor(private functionsService: FirebaseFunctionsService) {
        this.voiceSynth = new VoiceSynthesizer();
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
                this.userInput = event.results[0][0].transcript;
                this.isListening = false;
                this.sendMessage();
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event);
                this.isListening = false;
            };
        } else {
            console.warn("Speech recognition not supported in this browser.");
        }
    }

    ngOnInit() {
        if (this.isOpen) {
            this.startChat();
        }
    }

    ngOnChanges(changes: any) {
        if (changes.isOpen && changes.isOpen.currentValue === true && !changes.isOpen.previousValue) {
            this.startChat();
        }
    }

    ngOnDestroy() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    startChat() {
        if (!this.botId) return;
        this.isBotTyping = true;
        this.functionsService.callFunction('startChat', { userBotId: this.botId }).then(result => {
            this.isBotTyping = false;
            this.messages.push({ sender: 'bot', text: result.initialResponse });
            this.speak(result.initialResponse);
        }).catch(err => {
            this.isBotTyping = false;
            console.error('Error starting chat:', err);
        });
    }

    sendMessage() {
        if (!this.userInput.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: this.userInput };
        this.messages.push(userMessage);
        const history = this.messages.map(m => ({ role: m.sender, parts: [{ text: m.text }] }));

        this.isBotTyping = true;
        this.functionsService.callFunction('interactWithBot', {
            userBotId: this.botId,
            message: this.userInput,
            history: history
        }).then(result => {
            this.isBotTyping = false;
            const botMessage: ChatMessage = { sender: 'bot', text: result.response };
            this.messages.push(botMessage);
            this.speak(result.response);
        }).catch(err => {
            this.isBotTyping = false;
            console.error('Error interacting with bot:', err);
        });

        this.userInput = '';
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        } else {
            this.recognition.start();
            this.isListening = true;
        }
    }

    speak(text: string) {
        this.voiceSynth.speak(text);
    }

    onClose() {
        this.isOpen = false;
        this.close.emit();
    }
}
