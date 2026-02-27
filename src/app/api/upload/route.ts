import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini APIキーが設定されていません" }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
        }

        // Convert file to base64
        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        // Fetch custom categories
        const categories = await prisma.category.findMany({
            include: { subCategories: true }
        });

        const categoryNames = categories.map((c: any) => c.name).join("」「");

        let subCategoryInstructions = "";
        categories.forEach((c: any) => {
            if (c.subCategories.length > 0) {
                const subNames = c.subCategories.map((s: any) => s.name).join("」「");
                subCategoryInstructions += `  - ${c.name}の場合: 「${subNames}」のいずれか\n`;
            }
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `あなたはレシート解析アシスタントです。
画像から以下の情報を正確に抽出し、必ず指定されたJSON形式のみを出力してください。
Markdownのコードブロック (\`\`\`json など) は含めず、純粋なJSON文字列のみを出力してください。

【出力形式】
{
  "date": "YYYY-MM-DD",
  "totalAmount": 1200,
  "items": [
    {
      "name": "商品名",
      "price": 500,
      "category": "食費",
      "subCategory": "食材"
    }
  ]
}
※日付が読めない場合は本日の日付、または空文字を返してください。金額等にカンマが含まれる場合は数値として解釈してください。
※各商品に対して「category」を推測し、「${categoryNames}」の中から最も適切なものを1つ選んで出力してください。
※また、特定の大分類（category）の場合は、「subCategory」も以下から推測して出力してください。該当しない場合はnullまたは空文字にしてください。
${subCategoryInstructions}`
                        },
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: file.type,
                            }
                        }
                    ]
                }
            ]
        });

        const content = response.text;
        if (!content) {
            throw new Error("Gemini APIからの応答が空でした。");
        }

        // Try parsing the json response
        let jsonResult;
        try {
            jsonResult = JSON.parse(content);
        } catch {
            // In case it enclosed in markdown blocks
            const cleaned = content.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
            jsonResult = JSON.parse(cleaned);
        }

        return NextResponse.json(jsonResult);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || "解析中にエラーが発生しました" }, { status: 500 });
    }
}
