import { formatMessage } from "./format_message.js";
import { Post } from "@devvit/public-api";

/**
 * Returns the ListPreference settings: whether to use the White/Blacklist or both.
 */
export async function getListPreference(context: any) {
	const listPreference = await context.settings.get("list-preference") || ["none"];
	return Array.isArray(listPreference) ? String(listPreference[0]) : String(listPreference);
}

/**
 * Returns the IgnorePreference settings: whether to ignore removed/filtered posts or both.
 */
export async function getIgnorePreference(context: any) {
	const ignorePreference = await context.settings.get("ignore-preference") || [];
	return Array.isArray(ignorePreference) ? ignorePreference : [];
}

/**
 * Returns the CommentIgnorePreference settings: whether to ignore removed/filtered comments or both.
 */
export async function getCommentIgnorePreference(context: any) {
	const ignorePreference = await context.settings.get("comment-ignore-preference") || ["both"];
	return Array.isArray(ignorePreference) ? String(ignorePreference[0]) : String(ignorePreference);
}

/**
 * Returns the Whitelist settings: what posts the app should act on.
 */
export async function getWhitelistSettings(context: any) {
	const rawTitleRegex = await context.settings.get("wl-title-regex");
	let caseSensitiveTitleRegex = await context.settings.get("wl-title-regex-case");
	caseSensitiveTitleRegex = caseSensitiveTitleRegex ? "" : "i";
	const titleRegex = rawTitleRegex ? RegExp(JSON.parse(JSON.stringify(rawTitleRegex)), caseSensitiveTitleRegex) : null;

	const rawBodyRegex = await context.settings.get("wl-body-regex");
	let caseSensitiveBodyRegex = await context.settings.get("wl-body-regex-case");
	caseSensitiveBodyRegex = caseSensitiveBodyRegex ? "" : "i";
	const bodyRegex = rawBodyRegex ? RegExp(JSON.parse(JSON.stringify(rawBodyRegex)), caseSensitiveBodyRegex) : null;

	return {
		titleRegex, // Will be null if no regex is provided
		bodyRegex, // Will be null if no regex is provided
		bodyLinkRequired: Boolean(await context.settings.get("wl-body-link")) || false,
		bodyLength: Number(await context.settings.get("wl-body-length")) || 0,
		flairTexts: (String(await context.settings.get("wl-flair-text")) || "") // Divide the input flairs text into a
			// string array
			.split(",")
			.map((flair) => flair.trim().toLowerCase())
			.filter((flair) => flair.length > 0),
		flairIDs: (String(await context.settings.get("wl-flair-ids")) || "") // Divide the input flairs IDs into a
			// string array
			.split(",")
			.map((flair) => flair.trim())
			.filter((flair) => flair.length > 0),
		userFlairTexts: (String(await context.settings.get("wl-user-flair-text")) || "") // Divide the input flairs text
			// into a string array
			.split(",")
			.map((flair) => flair.trim().toLowerCase())
			.filter((flair) => flair.length > 0),
		userFlairIDs: (String(await context.settings.get("wl-user-flair-ids")) || "") // Divide the input flairs IDs
			// into a string array
			.split(",")
			.map((flair) => flair.trim())
			.filter((flair) => flair.length > 0)
	};
}

/**
 * Returns the Blacklist settings: what posts the app should ignore.
 */
export async function getBlacklistSettings(context: any) {
	const rawTitleRegex = await context.settings.get("bl-title-regex");
	let caseSensitiveTitleRegex = await context.settings.get("bl-title-regex-case");
	caseSensitiveTitleRegex = caseSensitiveTitleRegex ? "" : "i";
	const titleRegex = rawTitleRegex ? RegExp(JSON.parse(JSON.stringify(rawTitleRegex)), caseSensitiveTitleRegex) : null;

	const rawBodyRegex = await context.settings.get("bl-body-regex");
	let caseSensitiveBodyRegex = await context.settings.get("bl-body-regex-case");
	caseSensitiveBodyRegex = caseSensitiveBodyRegex ? "" : "i";
	const bodyRegex = rawBodyRegex ? RegExp(JSON.parse(JSON.stringify(rawBodyRegex)), caseSensitiveBodyRegex) : null;

	return {
		titleRegex, // Will be null if no regex is provided
		bodyRegex, // Will be null if no regex is provided
		bodyLinkRequired: Boolean(await context.settings.get("bl-body-link")) || false,
		bodyLength: Number(await context.settings.get("bl-body-length")) || 0,
		flairTexts: (String(await context.settings.get("bl-flair-text")) || "") // Divide the input flairs text into a
			// string array
			.split(",")
			.map((flair) => flair.trim().toLowerCase())
			.filter((flair) => flair.length > 0),
		flairIDs: (String(await context.settings.get("bl-flair-ids")) || "") // Divide the input flairs IDs into a
			// string array
			.split(",")
			.map((flair) => flair.trim())
			.filter((flair) => flair.length > 0),
		userFlairTexts: (String(await context.settings.get("bl-user-flair-text")) || "") // Divide the input flairs text
			// into a string array
			.split(",")
			.map((flair) => flair.trim().toLowerCase())
			.filter((flair) => flair.length > 0),
		userFlairIDs: (String(await context.settings.get("bl-user-flair-ids")) || "") // Divide the input flairs IDs
			// into a string array
			.split(",")
			.map((flair) => flair.trim())
			.filter((flair) => flair.length > 0)
	};
}

/**
 * Returns the Comment settings: what comment should be made.
 */
export async function getCommentSettings(context: any) {
	const checkNonTopLevel = Boolean(await context.settings.get("comment-level")) || false;
	const checkNonOP = Boolean(await context.settings.get("comment-author")) || false;
	const userIgnoreList = (String(await context.settings.get("comment-user-ignore")) || "") // Divide the input
		// usernames into a string array
		.split(",")
		.map((flair) => flair.trim().toLowerCase())
		.filter((flair) => flair.length > 0);
	const acceptAnyComment = Boolean(await context.settings.get("accept-any-comment")) || false;

	if (acceptAnyComment) {
		return {
			checkNonTopLevel: checkNonTopLevel,
			checkNonOP: checkNonOP,
			userIgnoreList: userIgnoreList,
			commentRegex: null, // No regex needed
			bodyLinkRequired: false // No link requirement
		};
	}

	const rawCommentRegex = await context.settings.get("comment-body-regex");
	let caseSensitiveRegex = await context.settings.get("comment-regex-case");
	caseSensitiveRegex = caseSensitiveRegex ? "" : "i";

	const commentRegex = rawCommentRegex ? RegExp(JSON.parse(JSON.stringify(rawCommentRegex)), caseSensitiveRegex) :
	                     null;

	return {
		checkNonTopLevel: checkNonTopLevel,
		checkNonOP: checkNonOP,
		userIgnoreList: userIgnoreList,
		commentRegex: commentRegex, // Null if no regex provided
		bodyLinkRequired: Boolean(await context.settings.get("comment-body-link")) || false
	};
}

/**
 * Returns the Notice settings: to notify the user to update their post or make a comment.
 * - the formatMessage method is used to handle the placeholders and footer.
 */
export async function getReminderSettings(post: Post, context: any) {
	const rawMessage = String(await context.settings.get("reminder-message")) || "";
	const random = (String(await context.settings.get("reminder-random"))
	                || "") // Divide the random values into a string array,
		.split(";")
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
	const message = rawMessage.length > 0 ? await formatMessage(context, rawMessage, random, post) : "";

	const rawOptions = await context.settings.get("reminder-options") || [];
	const options = Array.isArray(rawOptions) ? rawOptions : []; // Unpack array

	return {
		enabled: Boolean(await context.settings.get("reminder-enable")) || false,
		delay: parseInt(await context.settings.get("reminder-delay")) || 5,
		removeDelay: parseInt(await context.settings.get("reminder-remove-delay")) || 0,
		message: message,
		options: options
	};
}

/**
 * Returns the Action settings: what to do if a user does not update their post or make a comment.
 */
export async function getActionSettings(context: any) {
	const rawOptions = await context.settings.get("action-notify-options") || [];
	const options = Array.isArray(rawOptions) ? rawOptions : []; // Unpack array

	return {
		action: String(await context.settings.get("missing-link-action")) || "",
		crossAction: String(await context.settings.get("missing-link-cross-action")) || "",
		delay: parseInt(await context.settings.get("missing-link-delay")) || 10,
		reportReason: String(await context.settings.get("report-reason")) || "",
		changeFlairID: String(await context.settings.get("change-flair-id")) || "",
		removalReason: String(await context.settings.get("removal-reason")) || "",
		notifyUserVia: String(await context.settings.get("notify-user-via")) || "do_nothing",
		options: options,
		archiveModmail: Boolean(await context.settings.get("modmail-archive")) || false
	};
}