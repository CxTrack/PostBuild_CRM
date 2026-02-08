"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { urlFor } from "@/lib/sanity/image";

interface BlogCardProps {
    post: any;
    index: number;
}

export default function BlogCard({ post, index }: BlogCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group relative"
        >
            <Link href={`/blog/${post.slug.current}`} className="block">
                <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:border-[#FFD700]/30 group-hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">

                    {/* Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                        {post.featuredImage ? (
                            <Image
                                src={urlFor(post.featuredImage).width(600).height(375).url()}
                                alt={post.featuredImage.alt || post.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#1E90FF]/20 to-[#FFD700]/20" />
                        )}

                        {/* Category Badges */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {post.categories?.map((cat: any) => (
                                <span
                                    key={cat.slug.current}
                                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFD700] text-black"
                                >
                                    {cat.title}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#FFD700] transition-colors">
                            {post.title}
                        </h3>
                        <p className="text-white/50 text-sm line-clamp-3 mb-6 flex-1">
                            {post.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06] mt-auto">
                            {post.author?.image ? (
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                    <Image
                                        src={urlFor(post.author.image).width(40).height(40).url()}
                                        alt={post.author.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : null}
                            <div className="flex flex-col">
                                <span className="text-white/80 text-xs font-semibold">{post.author?.name}</span>
                                <span className="text-white/30 text-[10px]">
                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
