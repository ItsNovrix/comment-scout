import { Comment, Post } from "@devvit/public-api";

/**
 * Returns the id, title, body, flair and user text, flair and user ID of a given Post.
 */
export async function getPostParams(post: Post, userFlairText: string, userFlairID: string) {
	return {
		id: post.id,
		title: post.title,
		body: post.body ? post.body : "",
		flairText: post.flair?.text ? post.flair.text : "",
		flairID: post.flair?.templateId ? post.flair.templateId : "",
		userFlairText: userFlairText ? userFlairText : "",
		userFlairID: userFlairID ? userFlairID : ""
	};
}

/**
 * Returns true if the given string contains a link.
 */
export function containsLink(text: string): boolean {
	const urlRegex = /https?:\/\/[^\s]+/;
	return urlRegex.test(text);
}

/**
 * Recursively gathers all comment in a given comment thread.
 */
async function fetchCommentsRecursive(comment: Comment, comments: Comment[]) {
	comments.push(comment);
	for (const reply of await comment.replies.all()) {
		await fetchCommentsRecursive(reply, comments);
	}
}

/**
 * Returns an array of all comments in a given Post.
 */
export async function fetchAllComments(post: Post) {
	const comments: Comment[] = [];
	for (const comment of await post.comments.all()) {
		await fetchCommentsRecursive(comment, comments);
	}
	return comments;
}