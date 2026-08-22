import { ObjectId } from 'bson';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new Object(target) : target;
};
