export interface StoryGroupMember {
  id: string;
  userId: string;
  expiresAt: string;
  user: {
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface StoryGroup<T extends StoryGroupMember> {
  userId: string;
  user: T["user"];
  stories: T[];
}

export function groupStoriesByUser<T extends StoryGroupMember>(
  stories: readonly T[],
  currentUserId: string,
): StoryGroup<T>[] {
  const grouped = new Map<string, T[]>();
  for (const story of stories) {
    const userStories = grouped.get(story.userId) ?? [];
    userStories.push(story);
    grouped.set(story.userId, userStories);
  }

  const groups: StoryGroup<T>[] = [];
  for (const userStories of grouped.values()) {
    const firstStory = userStories[0];
    if (!firstStory) continue;
    groups.push({
      userId: firstStory.userId,
      user: firstStory.user,
      stories: userStories.sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt)),
    });
  }

  return groups.sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return Date.parse(b.stories[b.stories.length - 1].expiresAt) - Date.parse(a.stories[a.stories.length - 1].expiresAt);
  });
}
