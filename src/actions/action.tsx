import { JobContext, Post } from "@devvit/public-api";
import { getActionSettings } from "../settings/getters.js";
import { formatMessage } from "../settings/format_message.js";
import { formatMail } from "./format_mail.js";

/**
 * Given a Post,
 * - perform the required action or report the post if an invalid flair/removal reason ID is given.
 * - actions: change flair, remove (notify by comment, modmail or none), report
 */
export async function executeAction(context: JobContext, post: Post, crosspost: boolean) {
	const actionSettings = await getActionSettings(context);
	let reportReason = actionSettings.reportReason;

	// Handle crossposts
	const action = crosspost && actionSettings.crossAction != "default" ? actionSettings.crossAction :
	               actionSettings.action;

	switch (action) {
		case "flair":
			// Get flair template using the given ID
			const flairTemplates = await context.reddit.getPostFlairTemplates(post.subredditName);
			const flairTemplate = flairTemplates.find(template => template.id === actionSettings.changeFlairID);

			// Report post if given ID is invalid
			if (flairTemplate) {
				await context.reddit.setPostFlair({
					subredditName: post.subredditName, postId: post.id, flairTemplateId: actionSettings.changeFlairID
				});
				return;
			} else {
				console.error(`No post flair with ID '${actionSettings.changeFlairID}' exists.`);
				reportReason = "invalid change flair ID";
			}

			break;

		case "remove":
			// If a removal reason name is given
			if (actionSettings.removalReason) {
				// Get the removal reason using the given name
				const removalReasons = await context.reddit.getSubredditRemovalReasons(post.subredditName);
				const removalReason = removalReasons.find(reason => reason.title === actionSettings.removalReason);

				// Report post if given name is invalid
				if (removalReason) {
					await post.remove(false);
					await post.addRemovalNote(
						{reasonId: removalReason.id, modNote: `automated removal by ${context.appName}`});
					const commentMessage = await formatMessage(context, removalReason.message, [], post);

					if (actionSettings.notifyUserVia === "comment") {
						let comment = await post.addComment({text: commentMessage});
						const options = actionSettings.options;
						await comment.lock();

						// Set mod options
						if (options.length > 0) {
							if (options.includes("sticky")) {
								await comment.distinguish(true);
							} else if (options.includes("distinguish")) {
								await comment.distinguish(false);
							}
						}
					} else if (actionSettings.notifyUserVia === "modmail") {
						const conversation = await context.reddit.modMail.createConversation({
							body: await formatMail(context, post, removalReason),
							isAuthorHidden: true,
							subredditName: post.subredditName,
							subject: `Your post from ${post.subredditName} was removed`,
							to: post.authorName
						});

						// Archive if needed
						if (conversation.conversation.id && actionSettings.archiveModmail) {
							await context.reddit.modMail.archiveConversation(conversation.conversation.id);
						}
					}
					return;
				} else {
					console.error(`No removal reason with title '${actionSettings.removalReason}' exists.`);
					reportReason = `invalid removal reason`;
				}
			} else {
				await post.remove(false);
				return;
			}
			break;
	}

	reportReason = reportReason ? `${context.appName}: ${reportReason}` : `${context.appName}`;
	await context.reddit.report(post, {reason: reportReason});

}