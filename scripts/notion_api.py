#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notion API 客户端 — 零外部依赖
自动处理 API Key 读取和系统代理检测
"""

import os
import json
import platform
import subprocess
import urllib.request
import urllib.error
from typing import Dict, List, Optional, Any


class NotionAPI:
    """Notion API 客户端"""

    def __init__(self):
        self.api_key = self._get_api_key()
        if not self.api_key:
            raise ValueError(
                "未找到 NOTION_API_KEY，请先配置环境变量。\n"
                "Windows: [System.Environment]::SetEnvironmentVariable('NOTION_API_KEY', '你的KEY', 'User')\n"
                "Linux/Mac: export NOTION_API_KEY='你的KEY'"
            )

        self.base_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }

        # 自动检测并配置代理
        proxy = self._detect_proxy()
        if proxy:
            proxy_handler = urllib.request.ProxyHandler({
                'https': f'http://{proxy}',
                'http': f'http://{proxy}'
            })
            opener = urllib.request.build_opener(proxy_handler)
            urllib.request.install_opener(opener)

    def _get_api_key(self) -> str:
        """获取 API Key，支持环境变量和 Windows 用户级变量"""
        key = os.environ.get('NOTION_API_KEY', '')
        if key:
            return key

        # Windows: 尝试读取用户级环境变量
        if platform.system() == 'Windows':
            try:
                result = subprocess.run(
                    ['powershell', '-Command',
                     "[System.Environment]::GetEnvironmentVariable('NOTION_API_KEY', 'User')"],
                    capture_output=True, text=True, timeout=5
                )
                key = result.stdout.strip()
                if key:
                    return key
            except Exception:
                pass

        return ''

    def _detect_proxy(self) -> Optional[str]:
        """自动检测系统代理设置（Windows 注册表）"""
        if platform.system() != 'Windows':
            # Linux/Mac 检查环境变量
            for var in ('https_proxy', 'HTTPS_PROXY', 'http_proxy', 'HTTP_PROXY'):
                proxy = os.environ.get(var, '')
                if proxy:
                    return proxy.replace('http://', '').replace('https://', '')
            return None

        try:
            result = subprocess.run(
                ['powershell', '-Command',
                 "Get-ItemProperty -Path 'Registry::HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' | Select-Object -ExpandProperty ProxyServer"],
                capture_output=True, text=True, timeout=5
            )
            proxy = result.stdout.strip()
            if proxy:
                return proxy
        except Exception:
            pass
        return None

    def _request(self, url: str, method: str = "GET", data: Dict = None, timeout: int = 30) -> Dict:
        """统一的 HTTP 请求方法"""
        req_data = json.dumps(data).encode('utf-8') if data else None
        request = urllib.request.Request(url, data=req_data, headers=self.headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_msg = e.read().decode('utf-8')
            raise Exception(f"Notion API 错误 {e.code}: {error_msg}")

    # ========== 搜索 ==========

    def search(self, query: str = "", filter_type: Optional[str] = None, page_size: int = 20) -> Dict:
        """搜索页面和数据库

        Args:
            query: 搜索关键词，空字符串返回所有可访问内容
            filter_type: 过滤类型，可选 "page" 或 "database"
            page_size: 返回结果数量，最大 100
        """
        url = f"{self.base_url}/search"
        payload = {"query": query, "page_size": page_size}
        if filter_type:
            payload["filter"] = {"property": "object", "value": filter_type}
        return self._request(url, "POST", payload)

    # ========== 页面操作 ==========

    def create_page(self, parent_id: str, title: str, children: List[Dict],
                    icon_emoji: str = None) -> Dict:
        """创建新页面

        Args:
            parent_id: 父页面 ID
            title: 页面标题
            children: Notion 块列表（最多 100 个，超过需用 append_blocks 追加）
            icon_emoji: 页面图标 emoji（可选）
        """
        url = f"{self.base_url}/pages"
        payload = {
            "parent": {"type": "page_id", "page_id": parent_id},
            "properties": {
                "title": {"title": [{"type": "text", "text": {"content": title}}]}
            },
            "children": children[:100]  # API 限制最多 100 个块
        }
        if icon_emoji:
            payload["icon"] = {"type": "emoji", "emoji": icon_emoji}
        return self._request(url, "POST", payload)

    def get_page(self, page_id: str) -> Dict:
        """获取页面详情"""
        url = f"{self.base_url}/pages/{page_id}"
        return self._request(url, "GET")

    def update_page(self, page_id: str, properties: Dict = None,
                    icon_emoji: str = None, archived: bool = None) -> Dict:
        """更新页面属性"""
        url = f"{self.base_url}/pages/{page_id}"
        payload = {}
        if properties:
            payload["properties"] = properties
        if icon_emoji:
            payload["icon"] = {"type": "emoji", "emoji": icon_emoji}
        if archived is not None:
            payload["archived"] = archived
        return self._request(url, "PATCH", payload)

    def archive_page(self, page_id: str) -> Dict:
        """归档（删除）页面"""
        return self.update_page(page_id, archived=True)

    # ========== 块操作 ==========

    def get_block_children(self, block_id: str, page_size: int = 100) -> Dict:
        """获取块的子内容"""
        url = f"{self.base_url}/blocks/{block_id}/children?page_size={page_size}"
        return self._request(url, "GET")

    def append_blocks(self, block_id: str, children: List[Dict]) -> Dict:
        """向页面/块追加子块"""
        url = f"{self.base_url}/blocks/{block_id}/children"
        return self._request(url, "PATCH", {"children": children})

    def update_block(self, block_id: str, block_data: Dict) -> Dict:
        """更新指定块的内容"""
        url = f"{self.base_url}/blocks/{block_id}"
        return self._request(url, "PATCH", block_data)

    def delete_block(self, block_id: str) -> Dict:
        """删除指定块"""
        url = f"{self.base_url}/blocks/{block_id}"
        return self._request(url, "DELETE")

    # ========== 用户信息 ==========

    def get_me(self) -> Dict:
        """获取当前 integration 的 bot 信息"""
        url = f"{self.base_url}/users/me"
        return self._request(url, "GET")

    # ========== 便捷方法 ==========

    def search_pages(self, query: str = "") -> List[Dict]:
        """搜索页面，返回简化的结果列表"""
        result = self.search(query, filter_type="page")
        pages = []
        for item in result.get("results", []):
            title = ""
            props = item.get("properties", {})
            for key, val in props.items():
                if val.get("type") == "title":
                    title = "".join([t.get("plain_text", "") for t in val.get("title", [])])
                    break
            pages.append({
                "id": item["id"],
                "title": title,
                "url": item.get("url", ""),
                "archived": item.get("archived", False),
            })
        return pages

    def get_all_blocks(self, page_id: str) -> List[Dict]:
        """获取页面的所有块及其文本摘要"""
        result = self.get_block_children(page_id)
        blocks = []
        for block in result.get("results", []):
            btype = block.get("type", "")
            text = ""
            if btype in block:
                rt = block[btype].get("rich_text", [])
                text = "".join([t.get("plain_text", "") for t in rt])
            blocks.append({
                "id": block["id"],
                "type": btype,
                "text": text[:100],
                "has_children": block.get("has_children", False),
            })
        return blocks


if __name__ == "__main__":
    # 快速测试连接
    api = NotionAPI()
    me = api.get_me()
    print(f"✅ 连接成功！")
    print(f"   Bot: {me.get('name', 'unknown')}")
    print(f"   工作区: {me.get('bot', {}).get('workspace_name', 'unknown')}")

    pages = api.search_pages()
    print(f"   可访问页面: {len(pages)} 个")
    for p in pages[:5]:
        print(f"   - {p['title']} ({p['id']})")
