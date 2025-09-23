import { JobContext, Post, RemovalReason } from "@devvit/public-api";

/**
 * Replaces placeholders in a given message with their corresponding values and appends a footer to the end of it.
 * Currently, supports {{random}} for given random values and some AutoModerator placeholders.
 */
export async function formatMail(context: JobContext, post: Post, removalReason: RemovalReason): Promise<string> {
	const subreddit = await context.reddit.getCurrentSubreddit()
	const footer = "\n\n---\n*This action was performed automatically. "
	               + "Please respond to this message if you have any questions or concerns.*";

	let message = removalReason.message;
	message = message
		.replace(/\{community_name}/g, post.subredditName || "")
		.replace(/\{community_link}/g, `r/${post.subredditName}` || "")
		.replace(/\{community_description}/g, subreddit.description || "")
		.replace(/\{community_rules_url}/g, `https://www.reddit.com/r/${post.subredditName}/about/rules` || "");


	return `Your post from ${post.subredditName} was removed because of: '${removalReason.title}'` + "\n\n" +
	       `Hi u/${post.authorName}, ${message}` + "\n\n" +
	       `Original post: ${post.permalink}` + footer;
}