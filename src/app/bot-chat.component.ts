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
    options?: { id: string, text: string }[];
    song?: any;
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
                    <div *ngIf="msg.options" class="chat-options">
                        <button *ngFor="let option of msg.options" (click)="handleOptionClick(option)">
                            {{ option.text }}
                        </button>
                    </div>
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
        /* ... existing styles ... */
        .chat-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
        }

        .chat-options button {
            background-color: var(--primary-color, #0a84ff);
            color: var(--button-text-color, #fff);
            border-radius: 15px;
            padding: 8px 12px;
            text-align: left;
            cursor: pointer;
        }
    `]
})
export class BotChatComponent implements OnInit, OnDestroy {
    // ... (existing properties) ...
    messages: ChatMessage[] = [];

    // ... (constructor and other methods) ...
    @Input() botId!: string;
    @Input() botNickname: string = 'Rezonette Bot';
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();

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
            const botMessage: ChatMessage = {
                sender: 'bot',
                text: result.response,
                options: result.options,
                song: result.song
            };
            this.messages.push(botMessage);
            this.speak(result.response);
        }).catch(err => {
            this.isBotTyping = false;
            console.error('Error interacting with bot:', err);
        });

        this.userInput = '';
    }

    handleOptionClick(option: { id: string, text: string }) {
        // We can handle the option action here, or send it back to the bot.
        // For now, we'll just send the text back to the bot.
        this.userInput = option.text;
        this.sendMessage();
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
