#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notion 内容格式化工具
将 Markdown 文本转换为 Notion 块格式
"""

from typing import List, Dict, Optional


def rich(text: str, bold: bool = False, code: bool = False,
         italic: bool = False, color: str = None, url: str = None) -> Dict:
    """构造富文本对象"""
    r = {"type": "text", "text": {"content": text}}
    if url:
        r["text"]["link"] = {"url": url}
    ann = {}
    if bold: ann["bold"] = True
    if code: ann["code"] = True
    if italic: ann["italic"] = True
    if color: ann["color"] = color
    if ann: r["annotations"] = ann
    return r


def text_to_blocks(text: str) -> List[Dict]:
    """将 Markdown 风格文本转换为 Notion 块列表

    支持的格式：
    - # / ## / ###  → heading_1 / heading_2 / heading_3
    - - 或 *        → bulleted_list_item
    - 1. 2. 3.     → numbered_list_item
    - > 引用        → quote
    - --- 或 ***    → divider
    - 其他          → paragraph
    """
    lines = text.strip().split('\n')
    blocks = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # 分隔线
        if stripped in ('---', '***', '___'):
            blocks.append(create_divider())
        # 标题
        elif stripped.startswith('### '):
            blocks.append(_heading(3, stripped[4:]))
        elif stripped.startswith('## '):
            blocks.append(_heading(2, stripped[3:]))
        elif stripped.startswith('# '):
            blocks.append(_heading(1, stripped[2:]))
        # 引用
        elif stripped.startswith('> '):
            blocks.append(create_quote(stripped[2:]))
        # 有序列表
        elif len(stripped) > 2 and stripped[0].isdigit() and stripped[1] in '.）':
            blocks.append({
                "object": "block", "type": "numbered_list_item",
                "numbered_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": stripped[2:].strip()}}]
                }
            })
        # 无序列表
        elif stripped.startswith('- ') or stripped.startswith('* '):
            blocks.append({
                "object": "block", "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": stripped[2:]}}]
                }
            })
        # 段落
        else:
            blocks.append({
                "object": "block", "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": stripped}}]
                }
            })

    return blocks


def _heading(level: int, text: str) -> Dict:
    """创建标题块"""
    key = f"heading_{level}"
    return {
        "object": "block", "type": key,
        key: {"rich_text": [{"type": "text", "text": {"content": text}}]}
    }


def create_callout(text: str, emoji: str = "💡", color: str = "default") -> Dict:
    """创建提示框"""
    return {
        "object": "block", "type": "callout",
        "callout": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
            "icon": {"type": "emoji", "emoji": emoji},
            "color": color
        }
    }


def create_code_block(code: str, language: str = "python") -> Dict:
    """创建代码块"""
    return {
        "object": "block", "type": "code",
        "code": {
            "rich_text": [{"type": "text", "text": {"content": code}}],
            "language": language
        }
    }


def create_divider() -> Dict:
    """创建分隔线"""
    return {"object": "block", "type": "divider", "divider": {}}


def create_toc() -> Dict:
    """创建目录"""
    return {"object": "block", "type": "table_of_contents",
            "table_of_contents": {"color": "gray"}}


def create_toggle(title: str, children: List[Dict]) -> Dict:
    """创建折叠块"""
    return {
        "object": "block", "type": "toggle",
        "toggle": {
            "rich_text": [{"type": "text", "text": {"content": title}}],
            "children": children
        }
    }


def create_quote(text: str) -> Dict:
    """创建引用块"""
    return {
        "object": "block", "type": "quote",
        "quote": {
            "rich_text": [{"type": "text", "text": {"content": text}}]
        }
    }


def create_bookmark(url: str, caption: str = "") -> Dict:
    """创建书签"""
    block = {
        "object": "block", "type": "bookmark",
        "bookmark": {"url": url}
    }
    if caption:
        block["bookmark"]["caption"] = [{"type": "text", "text": {"content": caption}}]
    return block
