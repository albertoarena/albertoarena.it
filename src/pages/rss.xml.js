import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../utils/config";
import { getPostSlug } from "../utils/helpers";

export async function GET(context) {
    const posts = await getCollection("posts");
    const sortedPosts = posts
        .filter((post) => !post.data.draft)
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

    return rss({
        title: siteConfig.title,
        description: siteConfig.subtitle,
        site: context.site,
        items: sortedPosts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.date,
            description: post.data.description || "",
            link: `/posts/${getPostSlug(post)}/`,
        })),
    });
}