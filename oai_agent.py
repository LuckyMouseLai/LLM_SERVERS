from __future__ import annotations
import os
import sys
os.environ["http_proxy"] = "http://localhost:7890"
os.environ["https_proxy"] = "http://localhost:7890"
BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
API_KEY = 'sk-89864ea5e3514c5696e0291601ca7618'
MODEL_NAME = 'qwen-plus'
BASE_URL = 'https://api.siliconflow.cn/v1'
API_KEY = 'sk-rygdiwcigbccnoihlbnviehiqsutldlkrcmmodrjnwgforbf'
MODEL_NAME = 'Qwen/Qwen2.5-7B-Instruct'

import asyncio
import os
from pydantic import BaseModel
from openai import AsyncOpenAI
import uuid
from agents import (
    Agent,
    Model,
    ModelProvider,
    OpenAIChatCompletionsModel,
    RunConfig,
    Runner,
    function_tool,
    set_tracing_disabled,
    trace
)


if not BASE_URL or not API_KEY or not MODEL_NAME:
    raise ValueError(
        "Please set EXAMPLE_BASE_URL, EXAMPLE_API_KEY, EXAMPLE_MODEL_NAME via env var or code."
    )


"""This example uses a custom provider for some calls to Runner.run(), and direct calls to OpenAI for
others. Steps:
1. Create a custom OpenAI client.
2. Create a ModelProvider that uses the custom client.
3. Use the ModelProvider in calls to Runner.run(), only when we want to use the custom LLM provider.

Note that in this example, we disable tracing under the assumption that you don't have an API key
from platform.openai.com. If you do have one, you can either set the `OPENAI_API_KEY` env var
or call set_tracing_export_api_key() to set a tracing specific key.
"""
client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)
set_tracing_disabled(disabled=True)


class CustomModelProvider(ModelProvider):
    def get_model(self, model_name: str | None) -> Model:
        return OpenAIChatCompletionsModel(model=model_name or MODEL_NAME, openai_client=client)


CUSTOM_MODEL_PROVIDER = CustomModelProvider()





class weatherEvent(BaseModel):
    city: str
    weather: str

@function_tool
def get_weather(city: str):
    print(f"[debug] getting weather for {city}")
    return f"The weather in {city} is sunny."


async def main():
    agent = Agent(name="Assistant", instructions="你是一个工具人，你需要完成查询天气的任务.", tools=[get_weather])
    # https://github.com/openai/openai-agents-python/blob/main/docs/running_agents.md
    # This will use the custom model provider
    thread_id = str(uuid.uuid4())
    with trace(workflow_name="Conversation", group_id=thread_id):
        # First turn
        result = await Runner.run(
            agent,
            "我想知道现在的天气?",
            run_config=RunConfig(model_provider=CUSTOM_MODEL_PROVIDER),
        )
        print("aibot: ")
        print(result.final_output)
        
        new_input = result.to_input_list() + [{"role": "user", "content": "福州?"}]
        result = await Runner.run(agent, new_input, run_config=RunConfig(model_provider=CUSTOM_MODEL_PROVIDER))
        print(result.final_output)
        


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())