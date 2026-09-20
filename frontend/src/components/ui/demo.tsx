'use client';

import * as React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from 'lucide-react';

const components: { title: string; href: string; description: string }[] = [
  {
    title: 'Alert Dialog',
    href: '#alert-dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    href: '#hover-card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    href: '#progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    href: '#scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    href: '#tabs',
    description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    href: '#tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
];

function ListItem({ title, children, href, ...props }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <a href={href} className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white">
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-zinc-400 line-clamp-2 text-sm leading-snug">{children}</p>
        </a>
      </NavigationMenuLink>
    </li>
  );
}

export default function Component() {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Home</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] p-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full flex-col justify-end rounded-lg bg-gradient-to-b from-zinc-900 to-black p-6 no-underline outline-none select-none border border-zinc-800"
                    href="/"
                  >
                    <div className="mt-4 mb-2 text-lg font-bold text-white">DownZaro</div>
                    <p className="text-zinc-400 text-sm leading-tight">
                      Pioneering high-speed, privacy-first media downloads with stream muxing.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="#faq" title="Introduction">
                High-performance downloader built for 4K & lossless audio.
              </ListItem>
              <ListItem href="#features" title="Features">
                Cloud stream muxing and zero-ad architecture.
              </ListItem>
              <ListItem href="#how-it-works" title="How It Works">
                Step-by-step extraction and download workflow.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] p-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
              {components.map((component) => (
                <ListItem key={component.title} title={component.title} href={component.href}>
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href="#faq">FAQ</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>List</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
              <li>
                <NavigationMenuLink asChild>
                  <a href="#features" className="block p-2 rounded-lg hover:bg-white/10">
                    <div className="font-medium text-white text-sm">Components</div>
                    <div className="text-zinc-400 text-xs">Browse all components in the library.</div>
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a href="#how-it-works" className="block p-2 rounded-lg hover:bg-white/10">
                    <div className="font-medium text-white text-sm">Documentation</div>
                    <div className="text-zinc-400 text-xs">Learn how to use the downloader.</div>
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a href="#faq" className="block p-2 rounded-lg hover:bg-white/10">
                    <div className="font-medium text-white text-sm">FAQs</div>
                    <div className="text-zinc-400 text-xs">Answers to common media questions.</div>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-1 p-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
              <li>
                <NavigationMenuLink asChild>
                  <a href="#faq" className="flex items-center gap-2 p-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                    <CircleHelpIcon className="size-4 text-[#ef233c]" />
                    Help & FAQ
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a href="#features" className="flex items-center gap-2 p-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                    <CircleIcon className="size-4 text-amber-500" />
                    Pro Features
                  </a>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <a href="#how-it-works" className="flex items-center gap-2 p-2 rounded-lg text-sm text-zinc-300 hover:bg-white/10 hover:text-white">
                    <CircleCheckIcon className="size-4 text-emerald-500" />
                    System Status
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
