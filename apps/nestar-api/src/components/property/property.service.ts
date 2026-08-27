import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import type { ObjectId } from 'mongoose';

@Injectable()
export class PropertyService {
	constructor(
		@InjectModel('Property')
		private readonly propertyModel: Model<Property>,
		private memberService: MemberService,
	) {}

	public async createProperty(input: PropertyInput): Promise<Property> {
		try {
			const result = await this.propertyModel.create(input);

			//increase memberProperty

			if (input.memberId) {
				await this.memberService.memberStatsEditor({
					_id: input.memberId,
					targetKey: 'memberProperties',
					modifier: 1,
				});
			} // type error berdi Property dto ichida memberid? bolganiga

			return result;
		} catch (err) {
			console.log('ERROR, on createProperty', err);
			throw new InternalServerErrorException(Message.CREATE_FAILED);
		}
	}
}
