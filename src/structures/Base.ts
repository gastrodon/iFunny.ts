import deasync from "deasync"
import { type APIBasePayload, Endpoints } from "@ifunny/ifunny-api-types";
import type { Client } from "../client/Client";
import type { Nullify } from "../utils/Types";

type Fetchable<T> = Partial<T> & APIBasePayload;

/**
 * Base class for all structures.
 * @template Payload The payload of the object
 */
export class Base<Payload extends APIBasePayload> {
	/**
	 * Client instance attached to the Object
	 */
	readonly #client: Client;

	/**
	 * The payload of the object.
	 */
	#payload: Fetchable<Payload>;

	/**
	 * Whether this object has deliberately fetched its payload
	 */
	#fetched: boolean = false;

	/**
	 * Endpoint url the object will request to
	 */
	#endpointUrl: string = Endpoints.account;

	/**
	 * @param client The client instance
	 * @param payload The payload of the object
	 */
	public constructor(client: Client, payload: Fetchable<Payload>) {
		this.#client = client;
		this.#payload = payload;
	}

	/**
	 * The client instance attached to the Object
	 */
	public get client() {
		return this.#client;
	}

	/**
	 * Get the payload of the object
	 */
	public get payload(): Fetchable<Payload> {
		return this.#payload;
	}

	/**
	 * Updates the payload of the object.
	 * @param payload The payload to merge into the current instance
	 * @returns The current instance
	 */
	public set payload(payload: Partial<Payload>) {
		Object.assign(this.#payload, payload);
	}

	/**
	 * Endpoint url for requests to update the payload
	 */
	protected get endpointUrl(): string {
		return this.#endpointUrl;
	}

	protected set endpointUrl(value: string) {
		this.#endpointUrl = `${value}`;
	}

	/**
	 * Fetches the objects data from it's endpoint
	 * @returns The instance of the object
	 */
	public async fetch(): Promise<this> {
		const response = await this.client.instance.get(this.endpointUrl);
		this.#fetched = true;
		return (this.payload = response.data.data);
	}

	/**
	 * Gets the value from the payload from its key
	 * @param key The key to get the value of
	 * @returns
	 */
	protected get<P extends Payload, K extends keyof P>(key: K): Nullify<P[K]> {
		// @ts-ignore
		const v = this.payload[key];
		if (v === undefined && !this.#fetched) {
			deasync(this.fetch)();
			return this.get(key);
		}

		return (v ?? null) as Nullify<P[K]>;
	}

	/**
	 * The unique id of the object
	 */
	public get id(): string {
		return this.get("id");
	}

	/**
	 * Creates a new instance of the same structure with the same payload.
	 * @returns A clone of the current instance
	 */
	protected _clone(): this {
		return Object.assign(Object.create(this), this);
	}

	/**
	 * @returns The object's id
	 */
	public valueOf(): string {
		return this.id;
	}

	/**
	 * Converts the object instance into JSON
	 * @returns Stringified payload of the object
	 */
	public toJSON(): string {
		return JSON.stringify(this.payload, null, 2);
	}

	public toString(): string {
		return `${this.constructor.name} - ${this.id}`;
	}
}

export default Base;
