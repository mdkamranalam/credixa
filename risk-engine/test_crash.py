import asyncio
import numpy as np
import joblib

async def test():
    # Let's check what crashes in main
    from main import analyze_statement
    from fastapi import UploadFile
    import io

    # Mock UploadFile
    class MockUploadFile:
        def __init__(self, content):
            self.content_type = "application/pdf"
            self.content = content
        async def read(self):
            return self.content

    student_file = MockUploadFile(b"%PDF-1.4\n...")
    parent_file = MockUploadFile(b"%PDF-1.4\n...")

    try:
        res = await analyze_statement(student_file, parent_file, 7.0, False)
        print("Success:", res)
    except Exception as e:
        print("Crash!", e)

asyncio.run(test())
