'use client';

import React from "react";

interface SmoothScrollAnchorProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    id?: string;
}

export function SmoothScrollAnchor({ href, children, className, id }: SmoothScrollAnchorProps) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
                // Update browser URL hash without causing an instant viewport jump
                window.history.pushState(null, '', href);
            }
        }
    };

    return (
        <a id={id} href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
