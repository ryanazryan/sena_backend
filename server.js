import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post('/feedback', async (req, res) => {
  try {
    const { score, note, game, userRole } = req.body;

    if (!score || !game) {
      return res.status(400).json({ error: "Skor dan nama game wajib diisi." });
    }

    const scoringGuideline = `
      LEVEL 1 - Menemukan Informasi:
      Skor 10: Sangat Baik (Optimal). Siswa mampu menemukan semua informasi tersurat dalam teks.
      Rekomendasi: Pertahankan dengan soal pengayaan.
      
      Skor 7: Baik (Mampu). Siswa mampu menemukan sebagian besar informasi tersurat.
      Rekomendasi: Latihan dengan teks yang lebih panjang.
      
      Skor 4: Kurang (Terbatas). Siswa hanya mampu menemukan sedikit informasi.
      Rekomendasi: Fokus pada latihan intensif dengan teks pendek.
      
      Skor 0: Tidak Menguasai. Siswa tidak mampu menjawab benar sama sekali.
      Rekomendasi: Berikan intervensi remedial.

      LEVEL 2 - Menginterpretasi & Mengintegrasi:
      Skor 10: Sangat Baik (Optimal). Siswa mampu menginterpretasi dan mengintegrasi seluruh informasi dengan akurat.
      Rekomendasi: Berikan tugas pengayaan berupa analisis teks jamak.
      
      Skor 7: Baik (Mampu). Siswa mampu menginterpretasi sebagian besar informasi, tetapi ada beberapa detail yang luput.
      Rekomendasi: Latihan fokus pada ide pokok teks pendek.
      
      Skor 4: Kurang (Terbatas). Siswa hanya mampu membuat interpretasi yang sangat terbatas.
      Rekomendasi: Fokus pada latihan ide pokok teks pendek.
      
      Skor 0: Tidak Menguasai. Tidak dapat menginterpretasi informasi sama sekali.
      Rekomendasi: Berikan intervensi remedial intensif.

      LEVEL 3 - Mengevaluasi & Merefleksi:
      Skor 10: Sangat Baik (Optimal). Siswa mampu menilai akurasi dan kredibilitas teks secara kritis.
      Rekomendasi: Berikan tugas pengayaan berupa analisis perbandingan.
      
      Skor 7: Baik (Mampu). Siswa mampu melakukan evaluasi dasar, tetapi masih kesulitan dalam refleksi mendalam.
      Rekomendasi: Fokus pada latihan refleksi pengalaman pribadi sebelum mengaitkan dengan teks.
      
      Skor 4: Kurang (Terbatas). Siswa hampir tidak mampu melakukan evaluasi atau refleksi.
      Rekomendasi: Gunakan teks sederhana untuk melatih refleksi dasar.
      
      Skor 0: Tidak Menguasai. Tidak bisa mengevaluasi atau merefleksi sama sekali.
      Rekomendasi: Intervensi remedial dengan teks sangat sederhana.
    `;

    const prompt = `
      Anda adalah seorang guru literasi yang ramah dan memotivasi. Berdasarkan pedoman penilaian berikut, berikan feedback singkat dan edukatif untuk siswa.
      
      Pedoman Penilaian:
      ${scoringGuideline}

      Data Siswa:
      Game: ${game}
      Skor: ${score}
      Catatan Siswa: ${note || "Tidak ada catatan"}

      Tugas Anda:
      1. Tentukan kategori kemampuan siswa (Sangat Baik, Baik, Kurang, atau Tidak Menguasai) berdasarkan skor yang diberikan, mengacu pada Level penilaian yang relevan.
      2. Buatlah feedback yang positif dan membangun.
      3. Akhiri dengan rekomendasi langkah selanjutnya yang spesifik dan memotivasi, diambil dari pedoman di atas.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const feedback =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Tidak ada feedback.";

    return res.status(200).json({ feedback });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ error: "Gagal membuat feedback AI" });
  }
});

app.listen(port, () => {
  console.log(`Server API berjalan di http://localhost:${port}`);
});