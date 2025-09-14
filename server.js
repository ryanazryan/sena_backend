import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

app.use(
  cors({
    origin: ["http://localhost:3000", "https://tvp6l8-2222.csb.app"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

function cleanFeedback(text, maxChar = 1500) {
  if (!text) return "";
  let cleaned = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length > maxChar)
    cleaned = cleaned.slice(0, maxChar).trim() + "...";
  return cleaned;
}

export const feedbackGuidelines = {
  1: {
    10: {
      category: "Sangat Baik (Optimal)",
      description: "Siswa mampu menemukan semua informasi tersurat dalam teks dengan tepat dan konsisten. Ia mampu menggunakan kata kunci, membaca cepat, dan memilah detail penting dari teks tanpa kesalahan. Pemahamannya menunjukkan keterampilan literasi membaca literal yang matang.",
      recommendation: "Pertahankan dengan soal pengayaan: berikan teks yang lebih panjang atau teks jamak untuk melatih kecepatan dan ketepatan."
    },
    9: {
      category: "Sangat Baik",
      description: "Hampir seluruh informasi dapat ditemukan dengan akurat. Hanya ada 1 kesalahan kecil, misalnya kehilangan detail kata kunci atau salah menafsirkan satu pertanyaan. Secara umum, siswa sudah menguasai strategi menemukan informasi.",
      recommendation: "Latihan analisis detail: minta siswa menjelaskan mengapa ia memilih jawaban tertentu, untuk memperkuat akurasi."
    },
    8: {
      category: "Baik",
      description: "Siswa dapat menemukan sebagian besar informasi dengan benar. Masih ada 2 kesalahan, biasanya pada detail kecil atau informasi tersurat yang tersebar. Kemampuan membaca literal sudah baik, namun belum stabil.",
      recommendation: "Dorong strategi scanning: latih siswa mencari kata kunci dalam teks sebelum membaca detail keseluruhan."
    },
    7: {
      category: "Baik",
      description: "Siswa mampu menjawab lebih dari separuh soal dengan benar, tetapi masih ada 3 kesalahan yang menunjukkan kurang teliti atau salah memilih informasi yang relevan. Siswa kadang melewatkan informasi eksplisit.",
      recommendation: "Gunakan latihan menyorot teks: minta siswa menandai kalimat kunci dalam bacaan sebelum menjawab."
    },
    6: {
      category: "Cukup",
      description: "Kemampuan menemukan informasi masih terbatas. Siswa sering keliru memilih detail yang tidak relevan. Ia memahami teks secara umum, tetapi kurang cermat dalam menjawab.",
      recommendation: "Terapkan latihan guided reading: guru memberi petunjuk langkah demi langkah untuk menemukan jawaban dalam teks."
    },
    5: {
      category: "Cukup",
      description: "Siswa hanya mampu menemukan separuh informasi. Pemahaman literalnya masih dangkal, sering salah memahami pertanyaan dasar (siapa, kapan, di mana).",
      recommendation: "Berikan soal latihan bertahap dengan teks pendek dan pertanyaan sederhana agar siswa terbiasa mengenali detail tersurat."
    },
    4: {
      category: "Kurang",
      description: "Siswa kesulitan menemukan informasi; hanya sebagian kecil yang benar. Jawaban benar biasanya hanya pada pertanyaan yang sangat jelas dalam teks.",
      recommendation: "Gunakan peta konsep teks: minta siswa membuat tabel sederhana (tokoh, waktu, tempat, kejadian) agar lebih sistematis."
    },
    3: {
      category: "Kurang",
      description: "Kemampuan siswa masih rendah, hanya dapat menjawab benar beberapa soal. Sering tidak dapat mengaitkan pertanyaan dengan bagian teks yang sesuai.",
      recommendation: "Lakukan latihan membaca terarah: guru menunjuk kalimat dalam teks dan siswa menjawab pertanyaan langsung darinya."
    },
    2: {
      category: "Sangat Kurang",
      description: "Siswa sangat kesulitan menemukan informasi bahkan ketika eksplisit. Kesalahan lebih banyak karena tidak bisa mengidentifikasi kata kunci.",
      recommendation: "Latihan membaca bersama (shared reading): guru membaca teks keras-keras dan membimbing siswa menemukan jawaban."
    },
    1: {
      category: "Sangat Kurang",
      description: "Siswa hanya mampu menemukan sedikit informasi. Keterampilan literasi dasar (mengenali detail eksplisit) sangat terbatas.",
      recommendation: "Fokus pada latihan intensif: berikan teks sangat pendek (2–3 kalimat) dengan pertanyaan langsung (siapa, di mana)."
    },
    0: {
      category: "Tidak Menguasai",
      description: "Siswa tidak mampu menjawab benar sama sekali. Menunjukkan hambatan serius dalam memahami bacaan literal dan mengakses informasi dasar.",
      recommendation: "Berikan intervensi remedial: mulai dari teks sederhana, latihan membaca bersama, dan penggunaan media visual untuk membantu pemahaman."
    }
  },
  2: {
    10: {
        category: "Sangat Baik (Optimal)",
        description: "Siswa mampu menginterpretasi dan mengintegrasi seluruh informasi dengan akurat. Dapat menjelaskan ide pokok dan pendukung, menyusun inferensi logis, serta membuat prediksi dengan tepat. Menunjukkan keterampilan bernalar tinggi dalam membaca teks tunggal maupun jamak.",
        recommendation: "Berikan tugas pengayaan berupa analisis teks jamak (artikel + infografis) agar keterampilan integrasi lebih kompleks."
    },
    9: {
        category: "Sangat Baik",
        description: "Hampir seluruh jawaban benar, hanya ada 1 kesalahan kecil. Siswa mampu menyimpulkan ide dan membuat inferensi dengan sangat baik, namun sesekali kurang teliti dalam detail.",
        recommendation: "Latih dengan teks lebih bervariasi (ilmiah, sosial, personal) agar kemampuan konsisten dalam semua konteks."
    },
    8: {
        category: "Baik",
        description: "Sebagian besar soal dijawab benar. Siswa mampu menemukan ide pokok dan menyimpulkan isi teks, tetapi ada 2 kesalahan yang menunjukkan kelemahan dalam integrasi atau membandingkan informasi.",
        recommendation: "Gunakan latihan membandingkan 2 teks untuk memperkuat keterampilan integrasi."
    },
    7: {
        category: "Baik",
        description: "Lebih dari separuh soal dijawab benar. Siswa bisa menyimpulkan isi teks, tetapi kurang tepat dalam membuat prediksi atau menghubungkan informasi antar unsur pendukung (grafik/tabel).",
        recommendation: "Terapkan latihan visual literacy: minta siswa membaca teks sekaligus grafik untuk membuat kesimpulan."
    },
    6: {
        category: "Cukup",
        description: "Siswa mampu menjawab lebih dari setengah soal, namun sering salah saat menyusun inferensi. Kesimpulan yang dibuat masih parsial dan kadang tidak logis.",
        recommendation: "Latihan menyusun inferensi eksplisit: guru memberi petunjuk cara menarik kesimpulan dari dua kalimat teks."
    },
    5: {
        category: "Cukup",
        description: "Hanya separuh informasi diintegrasikan dengan benar. Siswa cenderung hanya memahami ide pokok tanpa mendalami hubungan antarbagian teks.",
        recommendation: "Berikan soal bertingkat dari ide pokok → ide pendukung → kesimpulan untuk melatih berpikir runtut."
    },
    4: {
        category: "Kurang",
        description: "Siswa hanya bisa menjawab benar sebagian kecil. Pemahaman ide pokok ada, tetapi gagal mengintegrasikan detail atau membandingkan informasi.",
        recommendation: "Gunakan peta konsep teks untuk membantu siswa melihat hubungan antaride."
    },
    3: {
        category: "Kurang",
        description: "Siswa hanya dapat menjawab sedikit soal dengan benar. Kesimpulan yang dibuat sering tidak sesuai teks. Masih kesulitan mengenali ide pendukung.",
        recommendation: "Lakukan latihan membaca terarah dengan pertanyaan panduan (misalnya: “apa ide pokok?”, “apa buktinya?”)."
    },
    2: {
        category: "Sangat Kurang",
        description: "Siswa sangat kesulitan menyusun inferensi, kesimpulan salah meskipun teks jelas. Hanya mampu menjawab pertanyaan literal sederhana.",
        recommendation: "Terapkan shared reading dengan guru: diskusikan bersama cara menemukan ide pokok dan menyusun kesimpulan."
    },
    1: {
        category: "Sangat Kurang",
        description: "Hampir tidak mampu membuat interpretasi. Hanya menjawab benar 1 soal karena kebetulan memahami detail sangat sederhana.",
        recommendation: "Fokus pada latihan ide pokok teks pendek sebelum melatih integrasi informasi."
    },
    0: {
        category: "Tidak Menguasai",
        description: "Tidak dapat menginterpretasi atau mengintegrasi informasi sama sekali. Tidak bisa menjelaskan ide pokok maupun menyusun inferensi.",
        recommendation: "Berikan intervensi remedial intensif: mulai dari teks sangat pendek dengan pertanyaan sederhana dan bimbingan guru."
    }
  },
  3: {
    10: {
        category: "Sangat Baik (Optimal)",
        description: "Siswa mampu menilai akurasi dan kredibilitas teks secara kritis, serta melakukan refleksi mendalam yang relevan dengan pengalaman nyata. Menunjukkan keterampilan berpikir kritis dan kesadaran reflektif yang matang.",
        recommendation: "Berikan tugas pengayaan berupa analisis perbandingan antara teks dan situasi nyata (misalnya berita vs pengalaman pribadi)."
    },
    9: {
        category: "Sangat Baik",
        description: "Hampir seluruh jawaban benar, hanya ada 1 kekeliruan kecil. Siswa mampu mengevaluasi isi teks dengan baik dan merefleksikan isinya, meski sesekali kurang mendalam.",
        recommendation: "Latihan analisis sumber ganda agar siswa lebih konsisten dalam mengevaluasi kredibilitas."
    },
    8: {
        category: "Baik",
        description: "Sebagian besar soal dijawab benar. Siswa dapat menilai teks dan memberikan refleksi, namun 2 kesalahan menunjukkan pemahaman kritis yang belum sepenuhnya konsisten.",
        recommendation: "Dorong siswa untuk menyebutkan alasan eksplisit setiap kali memberi evaluasi."
    },
    7: {
        category: "Baik",
        description: "Lebih dari separuh soal dijawab benar. Siswa dapat menilai sebagian aspek isi teks, tetapi refleksi sering dangkal atau kurang relevan dengan konteks pribadi.",
        recommendation: "Terapkan latihan diskusi reflektif agar siswa terbiasa mengaitkan isi teks dengan pengalaman."
    },
    6: {
        category: "Cukup",
        description: "Siswa mampu mengevaluasi beberapa isi teks, tetapi masih kesulitan menilai kredibilitas sumber atau membangun refleksi yang bermakna.",
        recommendation: "Lakukan latihan identifikasi bias dalam teks agar siswa lebih kritis."
    },
    5: {
        category: "Cukup",
        description: "Hanya separuh soal dijawab benar. Evaluasi dan refleksi masih terbatas, cenderung hanya menyebutkan ulang isi teks tanpa analisis.",
        recommendation: "Gunakan latihan tanya-jawab kritis: “Apakah teks ini bisa dipercaya? Mengapa?”"
    },
    4: {
        category: "Kurang",
        description: "Siswa hanya mampu menjawab sebagian kecil dengan benar. Evaluasi teks lemah, refleksi tidak relevan atau sangat dangkal.",
        recommendation: "Berikan contoh evaluasi sederhana dari guru, lalu minta siswa meniru pola berpikirnya."
    },
    3: {
        category: "Kurang",
        description: "Siswa kesulitan menilai isi teks. Jawaban refleksi sering tidak sesuai konteks, cenderung menebak.",
        recommendation: "Latih dengan teks singkat dan pertanyaan evaluatif langsung (misalnya: “apakah informasi ini benar?”)."
    },
    2: {
        category: "Sangat Kurang",
        description: "Siswa tidak mampu mengevaluasi isi dengan tepat, refleksi minim bahkan tidak ada.",
        recommendation: "Terapkan shared reading evaluatif: guru membaca teks, lalu bersama-sama menilai keakuratan informasi."
    },
    1: {
        category: "Sangat Kurang",
        description: "Siswa hampir tidak mampu melakukan evaluasi atau refleksi. Hanya menjawab benar 1 soal karena kebetulan memahami detail sederhana.",
        recommendation: "Fokus pada latihan refleksi pengalaman pribadi sederhana sebelum mengaitkan dengan teks."
    },
    0: {
        category: "Tidak Menguasai",
        description: "Tidak bisa mengevaluasi atau merefleksi sama sekali. Menunjukkan hambatan serius dalam berpikir kritis dan reflektif.",
        recommendation: "Intervensi remedial: gunakan teks sangat sederhana (cerita pendek, peribahasa) untuk melatih refleksi dasar."
    }
  }
};

app.post("/feedback", async (req, res) => {
  try {
    const { level, score, game, teacherNote } = req.body;

    const guidelineData = feedbackGuidelines[level]?.[score];

    if (!guidelineData) {
      return res.status(404).json({
        error: `Kombinasi level ${level} dan skor ${score} tidak ditemukan dalam panduan.`,
      });
    }

    const prompt = `
      Anda adalah Asisten Guru virtual yang sangat ramah dan pandai memberi semangat.
      Tugas Anda adalah membuat satu paragraf feedback untuk seorang siswa.
      IKUTI INSTRUKSI DAN STRUKTUR DI BAWAH INI DENGAN SANGAT TEPAT. JANGAN MENGUBAH FORMATNYA.

      Data untuk Feedback:
      - Nama Game: "${game}"
      - Skor Siswa: ${score} dari 10
      - Deskripsi Kemampuan Siswa: "${guidelineData.description}"
      - Rekomendasi untuk Siswa: "${guidelineData.recommendation}"
      - Pesan Tambahan dari Guru: "${teacherNote || "Tidak ada."}"

      Struktur Wajib:
      1. Bagian Apresiasi: Mulai dengan kalimat pembuka yang hangat seperti "Kerja bagus di game ${game}!".
      2. Bagian Definisi Skor: Jelaskan kemampuan siswa berdasarkan skor. Sisipkan pesan tambahan dari guru.
      3. Bagian Rekomendasi: Tutup dengan kalimat rekomendasi yang menyemangati.

      Gabungkan ketiga bagian menjadi satu paragraf yang mengalir dan enak dibaca.
      Gunakan bahasa sederhana dan positif. Jangan pakai format markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", text: prompt }],
    });

    const rawFeedback =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Tidak ada feedback yang dihasilkan.";

    const feedback = cleanFeedback(rawFeedback);

    res.status(200).json({ feedback });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({
      error: "Gagal membuat feedback AI",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
