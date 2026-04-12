import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;
  private readonly commentPrompt: string;
  private readonly postDescriptionPrompt: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.commentPrompt = this.readPrompt('comment-prompt.txt');
    this.postDescriptionPrompt = this.readPrompt('post-description-prompt.txt');
  }

  async generateComment(postDescription: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.commentPrompt },
        { role: 'user', content: postDescription },
      ],
    });

    return response.choices[0].message.content ?? '';
  }

  async enhancePostDescription(description: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.postDescriptionPrompt },
        { role: 'user', content: description },
      ],
    });

    return response.choices[0].message.content ?? '';
  }

  private readPrompt(filename: string): string {
    const promptPath = path.resolve(process.cwd(), 'prompts', filename);
    return fs.readFileSync(promptPath, 'utf-8');
  }
}
