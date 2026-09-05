import { ObjectId } from 'bson';

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableOptions = ['propertyBarter', 'propertyRent'];

export const availablePropertySorts = [
	'createdAt',
	'updatedAt',
	'propertyLikes',
	'propertyViews',
	'propertyRank',
	'propertyPrice',
];

export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];

export const availableCommentSorts = ['createdAt', 'updatedAt'];

// IMAGE CONFIGURATION (config.js)
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes', // haqiqiy layk yozuvlari saqlanadigan kolleksiya
			let: {
				localLikeRefId: targetRefId, // joriy hujjatning o'z _id'si (yoki ko'rsatilgan maydon)
				localMemberId: memberId, // so'rov yuborayotgan (joriy) a'zoning id'si
				localMyFavorite: true, // topilsa true qilib qaytarish uchun sobit qiymat
			},
			pipeline: [
				{
					$match: {
						$expr: {
							// faqat shu a'zoning aynan shu narsaga qo'ygan laykini qidiradi
							$and: [{ $eq: ['$likeRefId', '$$localLikeRefId'] }, { $eq: ['$memberId', '$$localMemberId'] }],
						},
					},
				},
				{
					$project: {   // Meliked mantigi
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite', // topilgan hujjatga "true" belgisini qo'shadi
					},
				},
			],
			as: 'meLiked', // natija shu nom bilan asosiy hujjatga qo'shiladi
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T; // joriy (so'rov yuborgan) a'zoning id'si
	followingId: string; // ro'yxatdagi har bir elementning tegishli maydoni (masalan "$followingId")
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows', // haqiqiy follow yozuvlari saqlanadigan kolleksiya
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true, // topilsa true qilib qaytarish uchun sobit qiymat
			},
			pipeline: [
				{
					$match: {
						$expr: {
							// joriy a'zo aynan shu odamni kuzatib turganmi (follow qilganmi) — tekshiradi
							$and: [
								{ $eq: ['$followerId', '$$localFollowerId'] },
								{ $eq: ['$followingId', '$$localFollowingId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite', // topilgan hujjatga "true" belgisini qo'shadi
					},
				},
			],
			as: 'meFollowed', // natija shu nom bilan asosiy hujjatga qo'shiladi
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'member',
		localField: 'memberId', // turgan collectiondagi memberId
		foreignField: '_id',
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'member',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'member',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'member', // "getFavoriteProperties" natijasidagi propertyning egasi (agent) ma'lumotini biriktiradi
		localField: 'favoriteProperty.memberId',
		foreignField: '_id',
		as: 'favoriteProperty.memberData',
	},
};

export const lookupVisit = {
	$lookup: {
		from: 'member', // "getVisitedProperties" natijasidagi propertyning egasi (agent) ma'lumotini biriktiradi
		localField: 'visitedProperty.memberId',
		foreignField: '_id',
		as: 'visitedProperty.memberData',
	},
};
