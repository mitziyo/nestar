import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import type { ObjectId } from 'mongoose';
import { StatisticModifier, T } from '../../libs/types/common';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';

@Injectable()
export class PropertyService {
	constructor(
		@InjectModel('Property')
		private readonly propertyModel: Model<Property>,
		private memberService: MemberService,
		private viewService: ViewService,
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

	public async getProperty(memberId: ObjectId, propertyId: ObjectId): Promise<Property> {
		const search: T = { _id: propertyId, propertyStatus: PropertyStatus.ACTIVE };
		const targetProperty = await this.propertyModel.findOne(search).lean<Property>().exec();

		if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
				targetProperty.propertyViews++;
			}

			targetProperty.memberData = await this.memberService.getMember(null, targetProperty.memberId);
		}
		return targetProperty;
	}

	public async propertyStatsEditor(input: StatisticModifier): Promise<Property> {
		const { _id, targetKey, modifier } = input;

		const result = await this.propertyModel
			.findByIdAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();

		if (!result) throw new InternalServerErrorException('Stats property error');

		return result;
	}
}
