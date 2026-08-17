import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	public async signup(input: MemberInput): Promise<Member> {
		try {
			// todo: HASHING
			const result = await this.memberModel.create(input);
			// todo: AUTHENTICATION TOKENS
			return result;
		} catch (err: any) {
			console.log('ERROR on signup service model', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHPNE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		try {
			const { memberNick, memberPassword } = input;
			const result = await this.memberModel.findOne({ memberNick: memberNick }).select('+memberPassword').exec();

			if (!result || result.memberStatus === MemberStatus.DELETE) {
				throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
			} else if (result.memberStatus === MemberStatus.BLOCK) {
				throw new InternalServerErrorException(Message.BLOCKED_USER);
			}

			// todo: BSCRYPT COMPARING PASSWORD

			const isMatch = memberPassword === result.memberPassword;

			if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

			return result;
		} catch (err) {
			console.log('ERROR on signup service model', err);
			throw new BadRequestException(err);
		}
	}

	public async updateMember(): Promise<String> {
		return 'UPFDATE PAGE';
	}

	public async getMember(): Promise<String> {
		return 'GTEMEMBER PAGE';
	}
}
