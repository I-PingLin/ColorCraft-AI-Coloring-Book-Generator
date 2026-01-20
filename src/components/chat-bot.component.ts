
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-chat-bot',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50">
      @if (!isOpen()) {
        <button 
          (click)="isOpen.set(true)"
          class="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      } @else {
        <div class="bg-white w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-indigo-100">
          <!-- Header -->
          <div class="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <span class="font-bold flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Coloring Buddy
            </span>
            <button (click)="isOpen.set(false)" class="text-indigo-100 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Messages -->
          <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            @for (msg of messages(); track $index) {
              <div class="flex" [class.justify-end]="msg.role === 'user'">
                <div [class]="msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-t-xl rounded-bl-xl p-3 max-w-[80%]' 
                  : 'bg-white text-gray-800 rounded-t-xl rounded-br-xl p-3 max-w-[80%] border border-gray-200'">
                  <p class="text-sm">{{ msg.text }}</p>
                </div>
              </div>
            }
            @if (isLoading()) {
              <div class="flex">
                <div class="bg-white rounded-xl p-3 border border-gray-200">
                  <div class="flex gap-1">
                    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-4 border-t border-gray-100 bg-white">
            <div class="flex gap-2">
              <input 
                type="text" 
                [(ngModel)]="userInput"
                (keyup.enter)="sendMessage()"
                placeholder="Ask for theme ideas..."
                class="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                (click)="sendMessage()"
                class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 disabled:opacity-50"
                [disabled]="!userInput().trim() || isLoading()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ChatBotComponent {
  private aiService = inject(AiService);
  private chatSession = this.aiService.createChatSession();

  isOpen = signal(false);
  isLoading = signal(false);
  userInput = signal('');
  messages = signal<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hi! I'm your Coloring Buddy. Want some fun theme ideas for your coloring book?" }
  ]);

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    this.messages.update(prev => [...prev, { role: 'user', text }]);
    this.userInput.set('');
    this.isLoading.set(true);

    try {
      const result = await this.chatSession.sendMessage({ message: text });
      this.messages.update(prev => [...prev, { role: 'assistant', text: result.text }]);
    } catch (err) {
      this.messages.update(prev => [...prev, { role: 'assistant', text: "Oops! I hit a snag. Let's try again!" }]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
