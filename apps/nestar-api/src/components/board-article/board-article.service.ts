import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { BoardArticleInput } from '../../libs/dto/board-article/board-article.input';
import { Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private memberService: MemberService,
	) {}

	public async createBoardArticle(memberId: ObjectId, input: BoardArticleInput): Promise<BoardArticle> {
		input.memberId = memberId;

		try {
			const result = await this.boardArticleModel.create(input);

			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberArticles',
				modifier: 1,
			});

			return result;
		} catch (err) {
			console.log('Error, Service.model:', err instanceof Error ? err.message : err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}
}
