import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { Member } from '../../libs/dto/member/member';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'bson';

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		console.log('Mutation: signup');
		return this.memberService.signup(input);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		console.log('Mutation: login');
		return this.memberService.login(input);
	}

	// Authenticated
	@UseGuards(AuthGuard)
	@Mutation(() => String)
	public async updateMember(@AuthMember('_id') memberId: ObjectId): Promise<String> {
		console.log('updateMember');

		return this.memberService.updateMember();
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<String> {
		console.log('checkAuth');
		console.log('memberNick:', memberNick);

		return `Hiii ${memberNick}`;
	}

	@Query(() => String)
	public async getMember(): Promise<String> {
		console.log('getMember');
		return this.memberService.getMember();
	}

	/** ADMIN **/

	/** Authorization: ADMIN **/

	@Mutation(() => String)
	public async getAllMembersByAdmin(): Promise<String> {
		return this.memberService.getAllMembersByAdmin();
	}

	// Authorization: ADMIN

	@Mutation(() => String)
	public async updateMemberByAdmin(): Promise<String> {
		return this.memberService.updateMemberByAdmin();
	}
}
