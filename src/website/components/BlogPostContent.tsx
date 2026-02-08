"use client";

import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

const components = {
    types: {
        image: ({ value }: any) => {
            return (
                <div className="relative w-full aspect-video my-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <Image
                        src={urlFor(value).width(1200).url()}
                        alt={value.alt || "Article image"}
                        fill
                        className="object-cover"
                    />
                </div>
            );
        },
    },
    block: {
        h1: ({ children }: any) => <h1 className="text-4xl md:text-5xl font-bold text-white mt-16 mb-6 tracking-tight">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-3xl md:text-4xl font-bold text-white mt-12 mb-5 tracking-tight border-l-4 border-[#FFD700] pl-6">{children}</h2>,
        h3: ({ children }: any) => <h3 className="text-2xl md:text-3xl font-bold text-white mt-10 mb-4 tracking-tight">{children}</h3>,
        h4: ({ children }: any) => <h4 className="text-xl md:text-2xl font-bold text-white mt-8 mb-3 tracking-tight">{children}</h4>,
        normal: ({ children }: any) => <p className="text-white/70 text-lg leading-relaxed mb-6 font-medium selection:bg-[#FFD700]/30">{children}</p>,
        blockquote: ({ children }: any) => (
            <blockquote className="bg-white/[0.03] border-l-4 border-[#FFD700] p-8 my-10 rounded-r-xl italic skew-x-[-2deg]">
                <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-semibold">"{children}"</p>
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: any) => <ul className="list-disc list-outside ml-6 space-y-3 mb-8 text-white/70 text-lg">{children}</ul>,
        number: ({ children }: any) => <ol className="list-decimal list-outside ml-6 space-y-3 mb-8 text-white/70 text-lg">{children}</ol>,
    },
    marks: {
        strong: ({ children }: any) => <strong className="font-extrabold text-white">{children}</strong>,
        em: ({ children }: any) => <em className="italic text-white/90">{children}</em>,
        link: ({ children, value }: any) => {
            const rel = !value.href.startsWith("/") ? "noreferrer noopener" : undefined;
            return (
                <a
                    href={value.href}
                    rel={rel}
                    className="text-[#FFD700] underline underline-offset-4 decoration-[#FFD700]/30 hover:decoration-[#FFD700] transition-colors"
                >
                    {children}
                </a>
            );
        },
        code: ({ children }: any) => (
            <code className="bg-white/[0.08] text-[#FFD700] px-2 py-0.5 rounded-md font-mono text-sm border border-white/[0.06]">
                {children}
            </code>
        ),
    },
};

export default function BlogPostContent({ body }: { body: any }) {
    return (
        <article className="prose prose-invert prose-lg max-w-none">
            <PortableText value={body} components={components} />
        </article>
    );
}
