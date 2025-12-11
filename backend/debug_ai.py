import sys
import os
from dotenv import load_dotenv

# Ensure we can import modules from current directory
sys.path.append(os.getcwd())

load_dotenv()

from ai import generate_question

print("Testing AI generation...")
try:
    context = "Time is money."
    result = generate_question(context, style="metaphorical")
    print("Result:", result)
except Exception as e:
    print("Exception occurred:", e)
