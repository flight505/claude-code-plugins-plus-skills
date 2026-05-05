#!/usr/bin/env python3
"""Create models reference from OpenRouter models.json"""

import json
import sys
from collections import defaultdict
from pathlib import Path

def create_models_reference(models_file: Path, output_file: Path):
    """Generate models reference markdown from models JSON"""

    with open(models_file) as f:
        data = json.load(f)

    models = data.get('data', [])

    with open(output_file, 'w') as out:
        out.write("# OpenRouter Models Reference\n\n")
        out.write(f"**Total Models:** {len(models)}\n")
        out.write("**Last Updated:** Generated from OpenRouter API\n\n")

        # Group models by provider
        by_provider = defaultdict(list)

        for model in models:
            model_id = model.get('id', '')
            provider = model_id.split('/')[0] if '/' in model_id else 'other'
            by_provider[provider].append(model)

        out.write("## Models by Provider\n\n")

        for provider in sorted(by_provider.keys()):
            out.write(f"### {provider.upper()}\n\n")

            for model in sorted(by_provider[provider], key=lambda x: x.get('id', '')):
                model_id = model.get('id', 'N/A')
                name = model.get('name', model_id)

                # Pricing
                pricing = model.get('pricing', {})
                prompt_price = pricing.get('prompt', 'N/A')
                completion_price = model.get('completion', 'N/A')

                # Context length
                context = model.get('context_length', 'N/A')

                out.write(f"#### {name}\n")
                out.write(f"- **ID:** `{model_id}`\n")

                if isinstance(context, int):
                    out.write(f"- **Context:** {context:,} tokens\n")
                else:
                    out.write(f"- **Context:** {context}\n")

                out.write(f"- **Pricing:** ${prompt_price}/1M prompt, ${completion_price}/1M completion\n")

                # Description if available
                if 'description' in model and model['description']:
                    desc = model['description'][:200]
                    out.write(f"- **Description:** {desc}...\n")

                out.write("\n")

        out.write("---\n\n")
        out.write("## Quick Model Selection Guide\n\n")
        out.write("### Best for Cost\n")
        out.write("- Look for models with lowest pricing per million tokens\n\n")
        out.write("### Best for Quality\n")
        out.write("- Claude Opus 4.5, GPT-4o, Gemini Pro\n\n")
        out.write("### Best for Speed\n")
        out.write("- Claude Haiku, GPT-4o-mini, Gemini Flash\n\n")
        out.write("### Best for Long Context\n")
        out.write("- Sort by context_length for models with 100k+ tokens\n\n")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <models.json> <output.md>", file=sys.stderr)
        sys.exit(1)

    models_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    if not models_file.exists():
        print(f"Error: {models_file} not found", file=sys.stderr)
        sys.exit(1)

    create_models_reference(models_file, output_file)
    print(f"Created {output_file}")
