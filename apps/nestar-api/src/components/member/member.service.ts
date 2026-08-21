import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { responsePathAsArray } from 'graphql';
@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private authService: AuthService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		try {
			input.memberPassword = await this.authService.hashPassword(input.memberPassword);
			const result = await this.memberModel.create(input);

			result.accessToken = await this.authService.createToken(result);

			return result;
		} catch (err: any) {
			console.log('ERROR on signup service model', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHPNE);
		}
	}

	public async login(input: LoginInput): Promise<Member> {
		try {
			const { memberNick, memberPassword } = input;
			console.log('input:', input);
			const response = await this.memberModel.findOne({ memberNick: memberNick }).select('+memberPassword').exec();

			if (!response || response.memberStatus === MemberStatus.DELETE) {
				throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
			} else if (response.memberStatus === MemberStatus.BLOCK) {
				throw new InternalServerErrorException(Message.BLOCKED_USER);
			}

			const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword);

			if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);
			response.accessToken = await this.authService.createToken(response);

			return response;
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
