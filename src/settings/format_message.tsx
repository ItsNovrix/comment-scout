import { JobContext, Post } from "@devvit/public-api";

/**
 * Replaces placeholders in a given message with their corresponding values and appends a footer to the end of it.
 * Currently, supports {{random}} for given random values and some AutoModerator placeholders.
 */
export async function formatMessage(context: JobContext, message: string, randomValues: string[], post: Post): Promise<string> {
	const footer = "\n\n---\n*I am a bot, and this action was performed automatically. "
	               + "Please [contact the moderators of this subreddit](https://www.reddit.com/message/compose/?to=/r/"
	               + post.subredditName + ") if you have any questions or concerns.*";

	// Handle {{random}} placeholder
	if (message.includes("{{random}}") && randomValues.length > 0) {
		const randomValue = randomValues[Math.floor(Math.random() * randomValues.length)];
		message = message.replace(/\{\{random}}/g, randomValue);
	}

	// Handle AutoModerator placeholders
	const subreddit = await context.reddit.getCurrentSubreddit();
	const user = await post.getAuthor();
	const author = post.authorName;

	let authorFlairText = "";
	let authorFlairCssClass = "";
	let authorFlairTemplateId = ""; // Not implemented.

	if (user) {
		const flair = await user.getUserFlairBySubreddit(post.subredditName);

		if (flair) {
			authorFlairText = flair.flairText || "";
			authorFlairCssClass = flair.flairCssClass || "";
		}
	}

	const postBody = post.body;
	const permalink = post.permalink;
	const kind = "submission"; // Currently, only posts are handled.
	const postTitle = post.title;
	const postUrl = post.url;
	const domain = getDomainName(postUrl);

	// Not implemented
	let mediaAuthor = "";
	let mediaAuthorUrl = "";
	let mediaTitle = "";
	let mediaDescription = "";

	message = message
		.replace(/\{\{author}}/g, author || "")
		.replace(/\{\{author_flair_text}}/g, authorFlairText || "")
		.replace(/\{\{author_flair_css_class}}/g, authorFlairCssClass || "")
		.replace(/\{\{author_flair_template_id}}/g, authorFlairTemplateId || "")

		.replace(/\{\{body}}/g, postBody || "")
		.replace(/\{\{permalink}}/g, permalink || "")
		.replace(/\{\{subreddit}}/g, subreddit.name || "")
		.replace(/\{\{kind}}/g, kind || "")
		.replace(/\{\{title}}/g, postTitle || "")
		.replace(/\{\{domain}}/g, domain || "")
		.replace(/\{\{url}}/g, postUrl || "")

		.replace(/\{\{media_author}}/g, mediaAuthor || "")
		.replace(/\{\{media_author_url}}/g, mediaAuthorUrl || "")
		.replace(/\{\{media_title}}/g, mediaTitle || "")
		.replace(/\{\{media_description}}/g, mediaDescription || "")

		.replace(/\{community_name}/g, post.subredditName || "")
		.replace(/\{community_link}/g, `r/${post.subredditName}` || "")
		.replace(/\{community_description}/g, subreddit.description || "")
		.replace(/\{community_rules_url}/g, `https://www.reddit.com/r/${post.subredditName}/about/rules` || "");

	return message + footer;
}

/**
 * Get the domain name of a given url.
 */
function getDomainName(url: string) {
	try {
		// Create a URL object
		const urlObject = new URL(url);

		// Return the hostname (domain name)
		return urlObject.hostname;
	} catch (error) {
		console.error("Invalid URL:", error);
		return "";
	}
}