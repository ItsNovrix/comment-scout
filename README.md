# About Comment Scout

Comment Scout is a flexible bot that can automatically post custom comments (Notices) on subreddit posts, helping maintain subreddit rules or encourage user interaction. Configurable criteria within the bot settings allow options for notices to be delayed, removed after a set time, distinguished, stickied, and more. Comment Scout can then automatically filter posts, remove them, or update post flairs if users do not respond to its initial notice within a configured timeframe. Comment Scout also includes whitelist and blacklist settings, allowing configuration based on post content, presence of links, flairs, and more, giving moderators precise control over how it acts.

While Comment Scout can be used for a variety of purposes, the name speaks to its main goal of helping make content attribution easier. When a user submits a post, Comment Scout can comment on the post with a configurable message requesting a source for the content. Comment Scout will then monitor the post for a set period of time, keeping an eye out for the OP to provide a source. If a comment hasn't been made within the set period of time, the post can then be filtered or removed. Comment Scout can provide removal reasons if these are configured in the installation settings.

[post_requirements]: https://i.imgur.com/iMZPgWd.png

[comment_requirements]: https://i.imgur.com/zNalaXb.png

[notice]: https://i.imgur.com/qKamT7V.png

[action]: https://i.imgur.com/6Voa0Zy.png

# Getting Started

Comment Scout is quick to set up in your subreddit. Follow these steps to get it running:

1. **Install the bot**
	- Go to the Comment Scout developer page and click **Add to community**.
	- Select the subreddit where you want Comment Scout active.
2. **Grant permissions**
	- Approve the requested permissions when prompted.
3. **Configure your settings**
	- In the settings panel, configure the settings for whitelist/blacklist, comment requirements, notice comments, and actions. See the sections below for more details on configuration.
4. **Test the bot**
	- Submit a test post to your subreddit.
	- Verify that Comment Scout reacts correctly.
5. **Adjust settings**
	- If needed, use the **Configuration** section to add further configuration and adjust your settings such as notice delay, auto-removal, enabling distinguishing/sticky, and more.

Once configured, Comment Scout will automatically handle new submissions according to your preferences.

# Configuration

Currently, the bot settings consist of five sections:

1. What type of filtering should the bot honor (whitelist, blacklist, both, or none)?
2. What posts should the bot act on (whitelist), and what posts should the bot ignore (blacklist)?
3. What type of comments should Comment Scout look for in the post and how should they be configured?
4. Should a notice be sent to the OP?
5. What should be done if the OP doesn't respond to their notice?

## 1. Post Requirements (White and Black List)

![post_requirements]

The whitelist configuration section allows you to customize what posts you want Comment Scout to act on. The
blacklist does the opposite, allowing you to select what posts the Comment Scout should ignore. You
can use either one, both or none (if you want to disable the app).

Optionally, you can choose to ignore approved, removed and/or filtered posts. 
Deleted posts are always ignored.

Currently, you can set:

- **A Regex pattern that the post title must match.**
	- Refer to your favourite Regex editor (e.g. https://regexr.com/).

- **A requirement for a link in the post body.**
	- This mainly applies to text posts that contain links - Link/Image posts
	  don't count.
	- Gallery/Multi-image posts are their own can of worms but long story
	  short, this also doesn't apply to the Caption and URL fields of those.

- **A requirement for minimum/maximum post body length.**

- **A list of post flairs, one of which the post must have.**
	- Flair Text or Flair Template ID can be used

- **A list of user flairs, one of which the user must have.**
	- Flair Text or Flair Template ID can be used
	- Note that due to technical constraints, the user flair is checked
	  **only** once when the post is first created. Unlike other
	  options, Comment Scout won't know if the user flair has been changed after a
	  notice is submitted and/or before an action is taken.

## 2. Comment Requirements

![comment_requirements]

If a post matches the whitelist or blacklist, Comment Scout will next look for a comment
matching certain criteria before sending a notice or performing an action as
described in the following sections.

Optionally, you can choose to ignore removed and or filtered comments.
Deleted comments are always ignored.

Currently, you can set:

- **A "check top-level comments" toggle if you want Comment Scout to check
  comments made as top-level-comments.**
	- The default setting is for Comment Scout to check non-top-level comments, requiring users to
	  respond to the Comment Scout notice rather than making a new top-level comment. 

- **A "check non-OP comments" toggle if you want Comment Scout to check
  comments made by users other than the OP.**
	- An Ignore List of users can be configured, with comments made by Comment Scout
	  being ignored by default.

- **An "accept all comments" overwrite that tells Comment Scout to accept any
  comment, bypassing all comment requirements (except the above)**

- **A Regex pattern that the comment body must match.**

- **A requirement for a link in the comment body.**

If such a comment is not found, Comment Scout will send a notice comment
and/or take the given action.

## 3. Notice Comment

![notice]

You can use this feature if you want Comment Scout to make a comment to inform users
to take a specific action to match the requirements of your subreddit. Comment Scout
will check the post and comments both before scheduling the notice and before
sending the comment. Notices are unlocked by default, but can be locked if desired.

Some placeholders have been implemented:

- Most [AutoModerator placeholders](https://www.reddit.com/r/reddit.com/wiki/automoderator/full-documentation/)
have been added except media placeholders,
match placeholders and ``{{author_flair_template_id}}``.

- ``{{random}}`` can be used to choose a random value from multiple given
  ones.

Currently, you can set:

- **The delay before sending the notice (in minutes).**
  - Tasks (notices, notice removals, actions) with delays under 10-15 minutes
    can occasionally fail to execute. To alleviate this, notices with a delay of
    under 10 minutes will instead be sent immediately. If you are experiencing problems,
    please try a larger delay. 

- **The delay before removing the notice (in minutes).**

- **The contents of the notice comment.**

- **Whether the notice should be distinguished, stickied and distinguished, or locked.**

## 4. Action on Missing Link/Comment

![action]

Here you decide what the app should do if the OP doesn't update their posts
or a comment isn't made to match the requirements. The app checks the post and
comments both before scheduling the action and before executing it.

Currently, you can set:

- **The type of action you want the app to take.**
	- Report Post: a custom report reason can be given.
	- Change Post Flair: a flair template ID is required.
	- Remove Post: a name of a removal reason can be given, and the user can
	  be notified via a comment or modmail.
		- Some placeholders are supported: `{community_name}`,
		  `{community_link}`,
		  `{community_rules_url}`
		- `{community_description}` seems to be giving the Old Reddit sidebar
		  instead, which may be a bug.

- **The delay before taking the action (in minutes).**
  - Tasks (notices, notice removals, actions) with delays under 10-15 minutes
    can occasionally fail to execute. To alleviate this, notices with a delay of
    under 10 minutes will instead be sent immediately. If you are experiencing problems,
    please try a larger delay. 

The post will be reported instead if an invalid Flair Template ID or Removal
Reason Name is given.

Optionally, you can also set a different action to be executed for crossposts.

# What's New?

### Comment Level Checking

Functionality has been adjusted to check non-top-level comments by default and optionally check top level comments.

### Optional Notice Comment Locking

Functionality has been implemented into Comment Scout's settings to optionally lock the notice comment.

### Notice Comment Unlocked

Comment Scout's notice comments are now unlocked by default, allowing users to reply directly to them if necessary.

# What's To Come 

- Implement functionality to optionally sticky notices and removal reasons separate from 'Distinguish & Sticky' option
- Implement functionality to optionally unlock removal comments by default

# Changelog

* v0.0.5: Basic functionality implemented.
* v0.0.11: Various updates to README and cleaning up code.
* v0.0.13: Default status of notice comments changed from locked to unlocked.
* v0.0.18: Further README updates, testing functionality of various features not yet implemented, cleaning up code.
* v0.0.25: Official launch of public-facing bot. Latest stable version.
* v0.0.32: Adjusted comment level checking. Non-top-level comments now checked by default, top-level comment checking can be optionally enabled.

# Feedback & Support

If you have any feedback/suggestions or need support, feel free to message [u/ItsNovrix](https://www.reddit.com/u/ItsNovrix) or visit [r/CommentScout](https://www.reddit.com/r/CommentScout). You can also view the source code on [GitHub](https://github.com/ItsNovrix/comment-scout/).
