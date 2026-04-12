import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;
  private readonly prompt: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const promptPath = path.resolve(
      process.cwd(),
      'prompts',
      'comment-prompt.txt',
    );
    this.prompt = fs.readFileSync(promptPath, 'utf-8');
  }

  async generateComment(postDescription: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.prompt },
        { role: 'user', content: postDescription },
      ],
    });

    return response.choices[0].message.content ?? '';
  }
}
