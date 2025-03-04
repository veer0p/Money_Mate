import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Import necessary modules
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  messages = [{ sender: 'bot', text: 'Hello! How can I help you today?' }];
  newMessage = '';
  apiUrl = 'https://api.mistral.ai/v1/chat/completions';
  apiKey = '2YMl9MTsBhn6CBZVowxfDDGBY3qMTRUr'; // ⚠️ Secure this in production

  constructor(private http: HttpClient) {}

  sendMessage() {
    if (this.newMessage.trim()) {
      // Add user message
      this.messages.push({ sender: 'user', text: this.newMessage });

      // Prepare API request
      const requestBody = {
        model: 'open-mixtral-8x22b',
        messages: [{ role: 'user', content: this.newMessage }],
      };

      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      });

      this.newMessage = ''; // Clear input field

      // Call API
      this.http.post(this.apiUrl, requestBody, { headers }).subscribe(
        (response: any) => {
          let botReply =
            response?.choices?.[0]?.message?.content ||
            'I couldn’t process that.';

          // Format response (replace new lines with <br>)
          botReply = botReply.replace(/\n/g, '<br>');

          this.messages.push({ sender: 'bot', text: botReply });
        },
        (error) => {
          console.error('API Error:', error);
          this.messages.push({
            sender: 'bot',
            text: 'Error fetching response. Please try again.',
          });
        }
      );
    }
  }
}
