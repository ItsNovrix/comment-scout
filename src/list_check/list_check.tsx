import { JobContext, Post } from "@devvit/public-api";
import {
	getBlacklistSettings,
	getIgnorePreference,
	getListPreference,
	getWhitelistSettings
} from "../settings/getters.js";
import { containsLink, fetchAllComments, getPostParams } from "./helpers.js";

/**
 * Given a set of post parameters and a black/whitelist settings,
 * returns a boolean on whether the given Post matches the given criteria.
 * - whitelist: all criteria must be true.
 * - blacklist: all criteria must be false.
 */
export function checkPostParams(postParams: {
	id: string,
	title: string,
	body: string,
	flairText: string,
	flairID: string,
	userFlairText: string,
	userFlairID: string
}, settings: {
	titleRegex: RegExp | null,
	bodyRegex: RegExp | null,
	bodyLinkRequired: boolean,
	bodyLength: number,
	flairTexts: string[],
	flairIDs: string[],
	userFlairTexts: string[],
	userFlairIDs: string[]
}, listPreference: string): boolean {
	// Unpack settings
	const {
		titleRegex, bodyRegex, bodyLinkRequired, bodyLength, flairTexts, flairIDs, userFlairTexts, userFlairIDs
	} = settings;

	const def = listPreference == "whitelist"; // Default: True for whitelist, False for blacklist

	// Title check
	const titlePass = titleRegex ? titleRegex.test(postParams.title) : def;

	// Body check
	const bodyPass = bodyRegex ? bodyRegex.test(postParams.body) : def;

	// Body contains link check
	const bodyLinkPass = bodyLinkRequired ? containsLink(postParams.body) : def;

	// Body length check
	const bodyLengthPass = bodyLength ? postParams.body.length >= bodyLength : def;

	// Flair text check
	const flairTextPass = flairTexts.length > 0 ? flairTexts.includes(postParams.flairText.toLowerCase()) : def;

	// Flair ID check
	const flairIDPass = flairIDs.length > 0 ? flairIDs.includes(postParams.flairID) : def;

	// User flair text check
	const userFlairTextPass = userFlairTexts.length > 0 ?
	                          userFlairTexts.includes(postParams.userFlairText.toLowerCase()) : def;

	// User flair ID check
	const userFlairIDPass = userFlairIDs.length > 0 ? userFlairIDs.includes(postParams.userFlairID) : def;

	console.log(`${def}: ${titlePass}, ${bodyPass}, ${bodyLinkPass}, ${bodyLengthPass}, ${flairTextPass}, ${flairIDPass}, ${userFlairTextPass}, ${userFlairIDPass}`);

	// Whitelist: all criteria must be true
	// Blacklist: all criteria must be false
	return def ?
	       titlePass && bodyPass && bodyLinkPass && bodyLengthPass && flairTextPass && flairIDPass && userFlairTextPass
	       && userFlairIDPass :
	       !(titlePass || bodyPass || bodyLinkPass || bodyLengthPass || flairTextPass || flairIDPass
	         || userFlairTextPass || userFlairIDPass);
}

/**
 * Given a Post,
 * if the post is not deleted,
 * compare it against the ignore preference and black/white list or both and,
 * returns true if it's a match (post should be processed further - add reminder/act).
 */
export async function checkPost(context: any, post: Post, userFlairText: string, userFlairID: string) {
	const removedByCategory = post.removedByCategory;
	const ignorePreference = await getIgnorePreference(context);

	// If removed/deleted or approved
	if (removedByCategory || post.isApproved()) {

		// Return false if approved and approved posts are ignored
		if (post.isApproved() && ignorePreference.includes("approved")) {
			console.info(`${post.id}: Ignoring (post is approved)`);
			return false;
		}

		// Continue processing if removed and removed posts are not ignored
		if ((removedByCategory == "author" || removedByCategory == "moderator") && !ignorePreference.includes("removed")) {

			// Continue processing if removed by Reddit and posts removed by Reddit are not ignored
		} else if (removedByCategory == "reddit" && !ignorePreference.includes("reddit")) {

			// Continue processing if filtered and filtered posts are not ignored
		} else if (removedByCategory == "automod_filtered" && !ignorePreference.includes("filtered")) {

			// Return false if removed/deleted and removed posts are ignored
		} else {
			console.info(`${post.id}: Ignoring (post is removed/deleted: ${removedByCategory})`);
			return false;
		}
	}

	const postParams = await getPostParams(post, userFlairText, userFlairID);
	const listPreference = await getListPreference(context);
	let match = false;

	if (listPreference == "whitelist") {
		match = checkPostParams(postParams, await getWhitelistSettings(context), listPreference);
	} else if (listPreference == "blacklist") {
		match = checkPostParams(postParams, await getBlacklistSettings(context), listPreference);
	} else if (listPreference == "both") {
		match = checkPostParams(postParams, await getWhitelistSettings(context), "whitelist") && checkPostParams(
			postParams, await getBlacklistSettings(context), "blacklist");
	} else { // Return false on 'none'
		return false;
	}

	return match;
}

/**
 * Given a Post and comment requirements,
 * check if post type is ignored (removed/filtered),
 * check if a comment has been made under the Post that matches the given requirements,
 * returns true if such a comment exists.
 */
export async function checkComments(context: JobContext, post: Post, settings: {
	checkTopLevel: boolean,
	checkNonOP: boolean,
	userIgnoreList: string[],
	commentRegex: RegExp | null,
	bodyLinkRequired: boolean
}, ignorePreference: string) {

	const {checkTopLevel, checkNonOP, userIgnoreList, commentRegex, bodyLinkRequired} = settings;
	const postAuthorID = post.authorId ? post.authorId : "";
	let comments = await fetchAllComments(post);

	for (const comment of comments) {
		const isRemoved = comment.isRemoved() || comment.isSpam();
		const bannedAt = comment.bannedAtUtc; // is a positive number if filtered by AutoMod

		if (ignorePreference != "none") { // Skip check if no comment types are ignored

			// Skip comment if comment is removed and removed comments are ignored
			if (isRemoved && (ignorePreference == "both" || ignorePreference == "removed")) {
				console.info(`${comment.id}: Ignoring (comment removed)`);
				continue;

				// Skip comment if comment is filtered and filtered comments are ignored
			} else if (bannedAt && (ignorePreference == "both" || ignorePreference == "filtered")) {
				console.info(`${comment.id}: Ignoring (comment filtered)`);
				continue;
			}
		}

		const commentAuthorName = comment.authorName ? comment.authorName : "";
		const commentAuthorID = comment.authorId ? comment.authorId : "";

		// Ignore comments made by the app
		if (!(commentAuthorName === context.appName) && !userIgnoreList.includes(commentAuthorName.toLowerCase())
			&& (checkNonOP || commentAuthorID === postAuthorID) && (checkTopLevel ? comment.parentId.startsWith(
			    "t3_") : !comment.parentId.startsWith("t3_"))) {

			const regexPass = commentRegex ? commentRegex.test(comment.body) : true;
			const bodyLinkPass = bodyLinkRequired ? containsLink(comment.body) : true;

			if (regexPass && bodyLinkPass) {
				return true;
			}
		}
	}
	return false;
}
