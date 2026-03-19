import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MessagesService } from '../../services/messages.service';
import { AuthService } from '../../services/auth.service';
import { Conversation, Message } from '../../models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="messages-page">
      <div class="messages-container">
        <div class="conversations-list">
          <h3>Conversations</h3>
          @for (conv of conversations; track conv.id) {
            <div
              class="conversation-item"
              [class.active]="selectedConversation?.id === conv.id"
              (click)="selectConversation(conv)"
            >
              <div class="conv-avatar">{{ (conv.otherUser.firstName || '?')[0] }}{{ (conv.otherUser.lastName || '?')[0] }}</div>
              <div class="conv-info">
                <p class="conv-name">{{ conv.otherUser.firstName }} {{ conv.otherUser.lastName }}</p>
                <p class="conv-listing">{{ conv.listing.title }}</p>
                <p class="conv-preview">{{ conv.lastMessage }}</p>
              </div>
              @if (conv.unreadCount > 0) {
                <span class="unread-badge">{{ conv.unreadCount }}</span>
              }
            </div>
          } @empty {
            <p class="empty">No conversations yet</p>
          }
        </div>

        <div class="chat-area">
          @if (selectedConversation) {
            <div class="chat-header">
              <h3>{{ selectedConversation.otherUser.firstName }} {{ selectedConversation.otherUser.lastName }}</h3>
              <p>{{ selectedConversation.listing.title }}</p>
            </div>
            <div class="chat-messages" #chatMessages>
              @for (msg of messages; track msg.id) {
                <div class="message" [class.mine]="msg.senderId === auth.currentUser?.id">
                  <div class="message-bubble">
                    <p>{{ msg.content }}</p>
                    <span class="message-time">{{ msg.createdAt | date:'short' }}</span>
                  </div>
                </div>
              }
            </div>
            <div class="chat-input">
              <input
                type="text"
                [(ngModel)]="newMessage"
                placeholder="Type a message..."
                (keyup.enter)="sendReply()"
              />
              <button (click)="sendReply()" [disabled]="sending">{{ sending ? 'Sending...' : 'Send' }}</button>
            </div>
          } @else {
            <div class="no-chat">
              <p>Select a conversation to start chatting</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-page {
      height: calc(100vh - 64px);
      background: #f8f9fa;
    }
    .messages-container {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 350px 1fr;
      height: 100%;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.08);
    }
    .conversations-list {
      border-right: 1px solid #eee;
      overflow-y: auto;
      padding: 1rem;
    }
    .conversations-list h3 { margin: 0 0 1rem; }
    .conversation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .conversation-item:hover, .conversation-item.active {
      background: #f0f0f0;
    }
    .conv-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1a1a2e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }
    .conv-info { flex: 1; min-width: 0; }
    .conv-name { font-weight: 600; margin: 0; font-size: 0.9rem; }
    .conv-listing { color: #888; margin: 0; font-size: 0.8rem; }
    .conv-preview {
      color: #999;
      margin: 0;
      font-size: 0.85rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .unread-badge {
      background: #e94560;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .chat-area { display: flex; flex-direction: column; }
    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .chat-header h3 { margin: 0; }
    .chat-header p { color: #888; margin: 4px 0 0; font-size: 0.85rem; }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message { display: flex; }
    .message.mine { justify-content: flex-end; }
    .message-bubble {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 12px;
      background: #f0f0f0;
    }
    .message.mine .message-bubble {
      background: #1a1a2e;
      color: white;
    }
    .message-bubble p { margin: 0 0 4px; }
    .message-time { font-size: 0.7rem; opacity: 0.6; }
    .chat-input {
      display: flex;
      gap: 8px;
      padding: 1rem;
      border-top: 1px solid #eee;
    }
    .chat-input input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
    }
    .chat-input button {
      padding: 12px 24px;
      background: #e94560;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    .no-chat {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    .empty { color: #999; text-align: center; padding: 2rem; }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessagesRef?: ElementRef;
  conversations: Conversation[] = [];
  selectedConversation?: Conversation;
  messages: Message[] = [];
  newMessage = '';
  sending = false;
  errorMsg = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private messagesService: MessagesService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    const sub = this.messagesService.getConversations().subscribe({
      next: (convs) => (this.conversations = convs),
      error: () => (this.errorMsg = 'Failed to load conversations'),
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation = conv;
    conv.unreadCount = 0;
    const sub = this.messagesService.getMessages(conv.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.scrollToBottom();
      },
      error: () => (this.errorMsg = 'Failed to load messages'),
    });
    this.subscriptions.push(sub);
  }

  sendReply() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    this.sending = true;
    const sub = this.messagesService
      .sendMessage({
        listingId: this.selectedConversation.listing.id,
        receiverId: this.selectedConversation.otherUser.id,
        content: this.newMessage.trim(),
      })
      .subscribe({
        next: () => {
          this.newMessage = '';
          this.sending = false;
          this.selectConversation(this.selectedConversation!);
        },
        error: () => {
          this.errorMsg = 'Failed to send message';
          this.sending = false;
        },
      });
    this.subscriptions.push(sub);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
