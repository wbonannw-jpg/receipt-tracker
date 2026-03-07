export type SalePlatformStatus = {
    name: string;
    isSaleToday: boolean;
    description: string;
    link?: string;
};

export type PhysicalStoreSaleStatus = {
    storeName: string;
    isSaleToday: boolean;
    description: string;
    distance?: number;
    address?: string;
};

// ============================================
// Online Shopping Rules
// ============================================

export function getOnlineSales(date: Date = new Date()): SalePlatformStatus[] {
    const day = date.getDate();
    const dayOfWeek = date.getDay(); // 0 is Sunday

    const results: SalePlatformStatus[] = [];

    // 1. Rakuten (楽天市場)
    let rakutenSale = false;
    let rakutenDesc = "";
    if (day % 5 === 0) {
        rakutenSale = true;
        rakutenDesc = "毎月5と0のつく日はポイント4倍対象日！";
    } else if (day === 18) {
        rakutenSale = true;
        rakutenDesc = "毎月18日は「いちばの日」！ポイント最大4倍！";
    } else if (day === 1) {
        rakutenSale = true;
        rakutenDesc = "毎月1日は「ワンダフルデー」！ポイント3倍！";
    }

    results.push({
        name: "楽天市場",
        isSaleToday: rakutenSale,
        description: rakutenDesc || "現在、定期セール日はありません",
        link: "https://www.rakuten.co.jp/"
    });

    // 2. Yahoo Shopping
    let yahooSale = false;
    let yahooDesc = "";
    if (day % 5 === 0) {
        yahooSale = true;
        yahooDesc = "5のつく日はYahoo!ショッピングでポイントアップ対象日！";
    }

    results.push({
        name: "Yahoo!ショッピング",
        isSaleToday: yahooSale,
        description: yahooDesc || "現在、定期セール日はありません",
        link: "https://shopping.yahoo.co.jp/"
    });

    // 3. Amazon (Typically irregular, handle prime day placeholders if needed)
    results.push({
        name: "Amazon",
        isSaleToday: false, // Amazon doesn't have regular day-of-month sales
        description: "定期的な特売日はありませんが、タイムセール祭りは要チェック！",
        link: "https://www.amazon.co.jp/"
    });

    return results;
}

// ============================================
// Physical Store Rules
// ============================================

/**
 * Checks a specific store name against known regular sale days.
 * Returns null if the store is not recognized, or a status object if it is.
 */
export function checkPhysicalStoreSale(storeName: string, date: Date = new Date()): PhysicalStoreSaleStatus | null {
    const day = date.getDate();
    // const dayOfWeek = date.getDay();

    const normalizedStoreName = storeName.toLowerCase().replace(/　/g, " ");

    // 1. Aeon Group (イオン, マックスバリュ, etc.)
    if (normalizedStoreName.includes("イオン") || normalizedStoreName.includes("マックスバリュ") || normalizedStoreName.includes("ダイエー")) {
        let isSale = false;
        let desc = "";

        if (day === 20 || day === 30) {
            isSale = true;
            desc = "お客さま感謝デー！各種カードで5%オフ！";
        } else if (day === 10) {
            isSale = true;
            desc = "ありが10デー！ポイント5倍！";
        } else if (day === 15) {
            isSale = true;
            desc = "G.G感謝デー！55歳以上の方は5%オフ！";
        }

        return { storeName, isSaleToday: isSale, description: desc || "今日は定期セール日ではありません" };
    }

    // 2. Welcia (ウエルシア薬局)
    if (normalizedStoreName.includes("ウエルシア") || normalizedStoreName.includes("welcia")) {
        let isSale = false;
        let desc = "";

        if (day === 20) {
            isSale = true;
            desc = "ウエルシアお客様感謝デー！WAON POINTのご利用で1.5倍分のお買い物！";
        } else if (day === 15 || day === 16) {
            isSale = true;
            desc = "シニアズデー！60歳以上の方はポイント3倍等の特典あり！";
        }

        return { storeName, isSaleToday: isSale, description: desc || "今日は定期セール日ではありません" };
    }

    // 3. Ito-Yokado (イトーヨーカドー)
    if (normalizedStoreName.includes("イトーヨーカドー")) {
        let isSale = false;
        let desc = "";

        if (day === 8 || day === 18 || day === 28) {
            isSale = true;
            desc = "ハッピーデー！各種カードご利用で5%オフ！";
        }

        return { storeName, isSaleToday: isSale, description: desc || "今日は定期セール日ではありません" };
    }

    // 4. Sugi Pharmacy (スギ薬局)
    if (normalizedStoreName.includes("スギ薬局")) {
        let isSale = false;
        let desc = "";

        if (day === 10 || day === 20) {
            isSale = true;
            desc = "スギともの日！アプリ会員に割引クーポン配信！";
        }

        return { storeName, isSaleToday: isSale, description: desc || "今日は定期セール日ではありません" };
    }

    // 5. Kohnan (コーナン)
    if (normalizedStoreName.includes("コーナン")) {
        // コーナンは定期的な〇日セールよりアプリ限定クーポンが多いがコーナンPayのチャージ特典あり
        return { storeName, isSaleToday: false, description: "アプリクーポンやチラシをチェック！" };
    }

    // If the store is not in our dictionary, return null to filter it out or display generic
    return null;
}
