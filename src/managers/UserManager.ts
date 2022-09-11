import {
	APIUser,
	Endpoints,
	RESTAPISuccessResponse as Success,
} from "@ifunny/ifunny-api-types";

import { CachedManager } from "./CachedManager";
import { Client } from "../client/Client";
import { User } from "../structures/User";
import { iFunnyError } from "../errors/iFunnyError";
import { iFunnyErrorCodes } from "../errors/iFunnyErrorCodes";

/**
 * Manages iFunny Users
 */
export class UserManager extends CachedManager<typeof User> {
	constructor(client: Client) {
		super(client, User);
	}

	/**
	 * Checks if a nick is available or if it's taken by another user\
	 * It's a good idea to check this before signing up or changing your nick
	 * @param nick Nick to check availability of
	 */
	public async nickAvailable(nick: string): Promise<boolean> {
		const { data } = await this.client.instance.get(Endpoints.nicksAvailable, {
			params: {
				nick,
			},
		});

		return data.data.available;
	}

	/**
	 * Checks if an email is available or if it's taken by another user\
	 * It's a good idea to check this before signing up or changing your email
	 * @param email Email to check availability of
	 */
	public async emailAvailable(email: string): Promise<boolean> {
		const { data } = await this.client.instance.get(Endpoints.emailsAvailable, {
			params: { email },
		});

		return data.data.available;
	}

	/**
	 * Fetches a user by their ID or Nick
	 * @param idOrNick Id or nick of the user
	 * @param byNick Whether to lookup by nick (Default: false)
	 * @param cached Whater to return the cached result (Default: true)
	 * @returns
	 */
	public async fetch(
		idOrNick: string,
		byNick: boolean = false,
		cached: boolean = true
	) {
		try {
			let user = this.resolve(idOrNick);
			if (cached && user) return user;

			let { data } = await this.client.instance.request<Success<APIUser> | null>({
				url: Endpoints.user(idOrNick, byNick),
			});
			if (!data) return data;
			user = new User(this.client, data.data);
			this.cache.set(user.id, user);
			this.cache.set(user.nick!, user);
			return user;
		} catch (error) {
			if (error instanceof iFunnyError) {
				if (error.code === iFunnyErrorCodes.UserNotFound) return null;
			}
			throw error;
		}
	}
}
