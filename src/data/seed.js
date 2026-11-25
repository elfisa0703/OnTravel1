export const HERO_IMAGE_URL =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Meuseujid_Raya_Baiturrahman%2C_Aceh.jpg/960px-Meuseujid_Raya_Baiturrahman%2C_Aceh.jpg';

export const REGIONS = [
  'Banda Aceh',
  'Sabang',
  'Aceh Besar',
  'Aceh Tengah',
  'Bener Meriah',
];

export const CATEGORIES = [
  'religi',
  'alam',
  'bahari',
  'sejarah',
  'budaya',
  'kuliner',
];

/** @type {Record<string, {id: string, en: string}>} */
export const CATEGORY_NAMES = {
  religi: {id: 'Religi', en: 'Religious'},
  alam: {id: 'Alam', en: 'Nature'},
  bahari: {id: 'Bahari', en: 'Marine'},
  sejarah: {id: 'Sejarah', en: 'History'},
  budaya: {id: 'Budaya', en: 'Culture'},
  kuliner: {id: 'Kuliner', en: 'Culinary'},
};

/**
 * @typedef {Object} DestinationItem
 * @property {string} id
 * @property {string} nama
 * @property {string} kategori
 * @property {string} wilayah
 * @property {string} deskripsi
 * @property {string} alamat
 * @property {number} estimasiBiaya
 * @property {string[]} fasilitas
 * @property {string} fasilitasIbadah
 * @property {boolean} unggulan
 * @property {string} verifikasi
 * @property {string} [imageUrl]
 * @property {string} [mapsUrl]
 */

/** @type {DestinationItem[]} */
export const SEED_DESTINATIONS = [
  {
    id: 'd01',
    nama: 'Masjid Raya Baiturrahman',
    kategori: 'religi',
    wilayah: 'Banda Aceh',
    deskripsi:
      'Ikon arsitektur dan ruang refleksi spiritual di pusat Banda Aceh. Hormati aturan kunjungan dan area ibadah.',
    alamat: 'Kecamatan Baiturrahman, Banda Aceh, Aceh',
    estimasiBiaya: 5000,
    fasilitas: ['Area kunjungan', 'Ruang terbuka', 'Area parkir (perlu konfirmasi)'],
    fasilitasIbadah:
      'Masjid berada di lokasi; aturan akses wisata dan fasilitas pengunjung perlu dikonfirmasi.',
    unggulan: true,
    verifikasi:
      'Nama destinasi dikenal luas; jam, akses, dan fasilitas terkini perlu konfirmasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Meuseujid_Raya_Bayturrahman.JPG/960px-Meuseujid_Raya_Bayturrahman.JPG',
  },
  {
    id: 'd02',
    nama: 'Museum Tsunami Aceh',
    kategori: 'sejarah',
    wilayah: 'Banda Aceh',
    deskripsi:
      'Ruang edukasi dan refleksi mengenai bencana tsunami 2004 serta pentingnya mitigasi bencana.',
    alamat: 'Jalan Sultan Iskandar Muda, Banda Aceh, Aceh',
    estimasiBiaya: 15000,
    fasilitas: ['Ruang pamer', 'Edukasi kebencanaan', 'Area publik'],
    fasilitasIbadah:
      'Fasilitas ibadah di sekitar lokasi perlu dikonfirmasi kepada pengelola.',
    unggulan: true,
    verifikasi:
      'Informasi operasional dan tarif dapat berubah; periksa kanal pengelola.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Aceh_Tsunami_Museum_site_visit%3B_February_2020_%2803%29.jpg/960px-Aceh_Tsunami_Museum_site_visit%3B_February_2020_%2803%29.jpg',
  },
  {
    id: 'd03',
    nama: 'PLTD Apung',
    kategori: 'sejarah',
    wilayah: 'Banda Aceh',
    deskripsi:
      'Kapal pembangkit yang menjadi salah satu pengingat peristiwa tsunami dan sejarah pemulihan Aceh.',
    alamat: 'Punge Blang Cut, Banda Aceh, Aceh',
    estimasiBiaya: 10000,
    fasilitas: ['Area monumen', 'Papan informasi', 'Area foto'],
    fasilitasIbadah: 'Fasilitas ibadah terdekat perlu dikonfirmasi.',
    unggulan: false,
    verifikasi: 'Status akses dan fasilitas terbaru perlu konfirmasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/PLTD_Apung.jpg/960px-PLTD_Apung.jpg',
  },
  {
    id: 'd04',
    nama: 'Gunongan dan Taman Putroe Phang',
    kategori: 'budaya',
    wilayah: 'Banda Aceh',
    deskripsi:
      'Kompleks taman bersejarah yang terkait dengan warisan Kesultanan Aceh.',
    alamat: 'Sukaramai, Baiturrahman, Banda Aceh, Aceh',
    estimasiBiaya: 5000,
    fasilitas: ['Taman', 'Bangunan bersejarah', 'Area berjalan'],
    fasilitasIbadah: 'Fasilitas ibadah terdekat perlu dikonfirmasi.',
    unggulan: false,
    verifikasi: 'Jam kunjungan dan detail fasilitas perlu konfirmasi.',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/96/COLLECTIE_TROPENMUSEUM_De_kraton_van_de_Sultan_van_Atjeh_in_Kota-Pecut_met_de_Gunungan_TMnr_60001940.jpg',
  },
  {
    id: 'd05',
    nama: 'Pantai Lampuuk',
    kategori: 'bahari',
    wilayah: 'Aceh Besar',
    deskripsi:
      'Kawasan pantai di pesisir Aceh Besar untuk menikmati lanskap laut dan suasana pesisir.',
    alamat: 'Kecamatan Lhoknga, Kabupaten Aceh Besar, Aceh',
    estimasiBiaya: 15000,
    fasilitas: [
      'Pesisir pantai',
      'Warung sekitar (perlu konfirmasi)',
      'Area parkir (perlu konfirmasi)',
    ],
    fasilitasIbadah:
      'Ketersediaan musala dan aksesnya perlu dikonfirmasi kepada pengelola/penyedia setempat.',
    unggulan: true,
    verifikasi: 'Tarif, kondisi pantai, dan fasilitas dapat berubah.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Lampuuk.jpg/960px-Lampuuk.jpg',
  },
  {
    id: 'd06',
    nama: 'Pantai Lhoknga',
    kategori: 'bahari',
    wilayah: 'Aceh Besar',
    deskripsi:
      'Bentang pantai dan pesisir yang dikenal sebagai salah satu tujuan rekreasi di Aceh Besar.',
    alamat: 'Kecamatan Lhoknga, Kabupaten Aceh Besar, Aceh',
    estimasiBiaya: 10000,
    fasilitas: [
      'Pesisir pantai',
      'Area rekreasi',
      'Warung sekitar (perlu konfirmasi)',
    ],
    fasilitasIbadah:
      'Fasilitas ibadah di sekitar kawasan perlu dikonfirmasi.',
    unggulan: false,
    verifikasi:
      'Periksa kondisi laut, cuaca, dan informasi keselamatan sebelum berkunjung.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Lhoknga_beach%2C_Aceh_20140912_113920.jpg/960px-Lhoknga_beach%2C_Aceh_20140912_113920.jpg',
  },
  {
    id: 'd07',
    nama: 'Pantai Iboih',
    kategori: 'bahari',
    wilayah: 'Sabang',
    deskripsi:
      'Destinasi pesisir Pulau Weh yang menjadi titik awal untuk menikmati panorama bawah laut dan wisata bahari.',
    alamat: 'Iboih, Sukakarya, Kota Sabang, Aceh',
    estimasiBiaya: 25000,
    fasilitas: [
      'Akses pesisir',
      'Aktivitas bahari dari operator lokal',
      'Warung sekitar (perlu konfirmasi)',
    ],
    fasilitasIbadah:
      'Ketersediaan ruang ibadah dan fasilitas bersuci perlu dikonfirmasi.',
    unggulan: true,
    verifikasi:
      'Cuaca, operator, tarif aktivitas, dan akses laut perlu konfirmasi langsung.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Iboih_beach%2C_Sabang%2C_Aceh%3B_August_2010.jpg/960px-Iboih_beach%2C_Sabang%2C_Aceh%3B_August_2010.jpg',
  },
  {
    id: 'd08',
    nama: 'Monumen Kilometer Nol Indonesia',
    kategori: 'budaya',
    wilayah: 'Sabang',
    deskripsi:
      'Monumen penanda titik paling barat Indonesia dan lokasi singgah untuk menikmati lanskap Pulau Weh.',
    alamat: 'Iboih, Sukakarya, Kota Sabang, Aceh',
    estimasiBiaya: 10000,
    fasilitas: ['Area monumen', 'Pemandangan', 'Area foto'],
    fasilitasIbadah: 'Fasilitas ibadah terdekat perlu dikonfirmasi.',
    unggulan: true,
    verifikasi:
      'Akses jalan, kondisi lokasi, dan layanan pengunjung perlu konfirmasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Tugu_KM_0_Sabang.png/960px-Tugu_KM_0_Sabang.png',
  },
  {
    id: 'd09',
    nama: 'Danau Lut Tawar',
    kategori: 'alam',
    wilayah: 'Aceh Tengah',
    deskripsi:
      'Danau di dataran tinggi Gayo dengan lanskap perairan dan pegunungan di sekelilingnya.',
    alamat: 'Takengon, Kabupaten Aceh Tengah, Aceh',
    estimasiBiaya: 15000,
    fasilitas: [
      'Panorama danau',
      'Area tepian danau',
      'Kios/area singgah (perlu konfirmasi)',
    ],
    fasilitasIbadah:
      'Fasilitas ibadah bergantung pada titik kunjungan; konfirmasi lokasi terdekat.',
    unggulan: true,
    verifikasi:
      'Area tepi danau memiliki titik kunjungan berbeda; detail fasilitas perlu konfirmasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Danau_Laut_Tawar_Takengon.jpg/960px-Danau_Laut_Tawar_Takengon.jpg',
  },
  {
    id: 'd10',
    nama: 'Pantan Terong',
    kategori: 'alam',
    wilayah: 'Aceh Tengah',
    deskripsi:
      'Kawasan perbukitan untuk menikmati panorama dataran tinggi Gayo; kondisi cuaca dapat memengaruhi jarak pandang.',
    alamat: 'Kecamatan Bebesen, Kabupaten Aceh Tengah, Aceh',
    estimasiBiaya: 15000,
    fasilitas: [
      'Titik pandang',
      'Area foto',
      'Akses jalan (perlu konfirmasi)',
    ],
    fasilitasIbadah:
      'Fasilitas ibadah di sepanjang rute perlu dikonfirmasi.',
    unggulan: false,
    verifikasi:
      'Akses dan kondisi cuaca/jalan perlu diperiksa sebelum perjalanan.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Pantan_Terong_Aceh.jpg/960px-Pantan_Terong_Aceh.jpg',
  },
  {
    id: 'd11',
    nama: 'Burni Telong',
    kategori: 'alam',
    wilayah: 'Bener Meriah',
    deskripsi:
      'Gunung di kawasan dataran tinggi Gayo yang relevan untuk wisata alam dan aktivitas pendakian dengan persiapan memadai.',
    alamat: 'Kabupaten Bener Meriah, Aceh',
    estimasiBiaya: 30000,
    fasilitas: [
      'Jalur alam (perlu konfirmasi)',
      'Pemandu lokal (perlu konfirmasi)',
      'Area persiapan',
    ],
    fasilitasIbadah:
      'Rencana waktu dan titik ibadah perlu disiapkan bersama pemandu/pengelola.',
    unggulan: false,
    verifikasi:
      'Perizinan, status jalur, cuaca, dan kebutuhan pemandu wajib dikonfirmasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Bayangan_segitiga_gunung_burni_telong_aceh.jpg/960px-Bayangan_segitiga_gunung_burni_telong_aceh.jpg',
  },
  {
    id: 'd12',
    nama: 'Kawasan Budaya Gayo',
    kategori: 'budaya',
    wilayah: 'Aceh Tengah',
    deskripsi:
      'Pengalaman pengenalan tradisi, rumah adat, seni, dan produk lokal Gayo melalui komunitas atau penyedia yang berizin.',
    alamat: 'Takengon dan sekitarnya, Kabupaten Aceh Tengah, Aceh',
    estimasiBiaya: 20000,
    fasilitas: [
      'Pengalaman budaya (perlu konfirmasi)',
      'Produk kerajinan lokal',
      'Interaksi komunitas dengan izin',
    ],
    fasilitasIbadah:
      'Kebutuhan ibadah dapat dibicarakan dengan penyelenggara kegiatan.',
    unggulan: false,
    verifikasi:
      'Nama ini mewakili pengalaman budaya umum, bukan satu situs resmi; penyelenggara harus diverifikasi.',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Gayo_Lues_Forest.jpg/960px-Gayo_Lues_Forest.jpg',
  },
];

/**
 * @typedef {Object} CulinaryItem
 * @property {string} id
 * @property {string} nama
 * @property {string} kategori
 * @property {string} wilayah
 * @property {number} harga
 * @property {string} statusSertifikasiHalal
 * @property {string} sumberVerifikasi
 * @property {string} kontak
 * @property {string} [imageUrl]
 */

/** @type {CulinaryItem[]} */
export const SEED_CULINARY = [
  {
    id: 'c01',
    nama: 'Mie Aceh',
    kategori: 'Makanan utama',
    wilayah: 'Banda Aceh',
    harga: 25000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Belum ada bukti resmi pada data demo',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Mie_Aceh_with_crab.jpg/960px-Mie_Aceh_with_crab.jpg',
  },
  {
    id: 'c02',
    nama: 'Kuah Beulangong',
    kategori: 'Masakan tradisional',
    wilayah: 'Aceh Besar',
    harga: 35000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Periksa sertifikat dan dapur penyedia',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Kuah_Beulangong.JPG/960px-Kuah_Beulangong.JPG',
  },
  {
    id: 'c03',
    nama: 'Ayam Tangkap',
    kategori: 'Makanan utama',
    wilayah: 'Banda Aceh',
    harga: 30000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Belum ada bukti resmi pada data demo',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Ayam_Tangkap.jpg/960px-Ayam_Tangkap.jpg',
  },
  {
    id: 'c04',
    nama: 'Kue Timphan',
    kategori: 'Kue tradisional',
    wilayah: 'Banda Aceh',
    harga: 18000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Periksa bahan dan proses produksi kepada UMKM',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Timphan_Asoekaya.jpg/960px-Timphan_Asoekaya.jpg',
  },
  {
    id: 'c05',
    nama: 'Kopi Gayo',
    kategori: 'Produk UMKM',
    wilayah: 'Aceh Tengah',
    harga: 65000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Periksa dokumen produk/produksi yang relevan',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Kopi_Hitam_King_Gayo_Arabika.jpg/960px-Kopi_Hitam_King_Gayo_Arabika.jpg',
  },
  {
    id: 'c06',
    nama: 'Kopi Arabika Gayo',
    kategori: 'Produk UMKM',
    wilayah: 'Bener Meriah',
    harga: 70000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Periksa dokumen produk/produksi yang relevan',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Pruned_and_well_maintained_coffee_trees_in_Takengon_Aceh_%285281249301%29.jpg/960px-Pruned_and_well_maintained_coffee_trees_in_Takengon_Aceh_%285281249301%29.jpg',
  },
  {
    id: 'c07',
    nama: 'Kue Adee',
    kategori: 'Kue tradisional',
    wilayah: 'Aceh Besar',
    harga: 22000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi: 'Periksa bahan dan proses produksi kepada UMKM',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Bingka_kantang_halus.jpg/960px-Bingka_kantang_halus.jpg',
  },
  {
    id: 'c08',
    nama: 'Asam Keueng',
    kategori: 'Masakan tradisional',
    wilayah: 'Banda Aceh',
    harga: 32000,
    statusSertifikasiHalal: 'Belum diverifikasi',
    sumberVerifikasi:
      'Konfirmasi bahan, dapur, dan status sertifikasi penyedia',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Sop_Ikan_Asam_Pedas_Batam.jpg/960px-Sop_Ikan_Asam_Pedas_Batam.jpg',
  },
];

/**
 * @typedef {Object} StayItem
 * @property {string} id
 * @property {string} nama
 * @property {string} wilayah
 * @property {number} hargaPerMalam
 * @property {string[]} fasilitas
 * @property {string} fasilitasRamahMuslim
 * @property {string} kontak
 * @property {string} [imageUrl]
 */

/** @type {StayItem[]} */
export const SEED_STAYS = [
  {
    id: 's01',
    nama: 'Akomodasi Contoh Banda Aceh 01',
    wilayah: 'Banda Aceh',
    hargaPerMalam: 320000,
    fasilitas: ['Wi-Fi (simulasi)', 'Parkir (simulasi)', 'Sarapan (konfirmasi)'],
    fasilitasRamahMuslim:
      'Informasi arah kiblat, sajadah, dan pilihan layanan perlu dikonfirmasi langsung.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Savoy_Boutique_standard_room_-_panoramio.jpg/960px-Savoy_Boutique_standard_room_-_panoramio.jpg',
  },
  {
    id: 's02',
    nama: 'Akomodasi Contoh Banda Aceh 02',
    wilayah: 'Banda Aceh',
    hargaPerMalam: 450000,
    fasilitas: ['Wi-Fi (simulasi)', 'Resepsionis', 'Area keluarga'],
    fasilitasRamahMuslim:
      'Permintaan kamar/layanan ramah Muslim dapat ditanyakan; belum diverifikasi.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Lobby_lounge_of_Amantaka_Suite_Amantaka_luxury_Resort_%26_Hotel_Luang_Prabang_Laos.jpg/960px-Lobby_lounge_of_Amantaka_Suite_Amantaka_luxury_Resort_%26_Hotel_Luang_Prabang_Laos.jpg',
  },
  {
    id: 's03',
    nama: 'Akomodasi Contoh Sabang 01',
    wilayah: 'Sabang',
    hargaPerMalam: 380000,
    fasilitas: ['Area santai', 'Akses kawasan wisata'],
    fasilitasRamahMuslim:
      'Fasilitas ibadah dan makanan perlu konfirmasi kepada penyedia.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Lakuen_Beach_Bungalow_in_Lombok_island.jpg/1280px-Lakuen_Beach_Bungalow_in_Lombok_island.jpg',
  },
  {
    id: 's04',
    nama: 'Akomodasi Contoh Aceh Besar 01',
    wilayah: 'Aceh Besar',
    hargaPerMalam: 280000,
    fasilitas: ['Parkir (simulasi)', 'Area keluarga'],
    fasilitasRamahMuslim:
      'Konfirmasi arah kiblat, sajadah, dan opsi makanan secara langsung.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Blaise_Rustic_Cottage_newly_thatched_%282586986951%29.jpg/960px-Blaise_Rustic_Cottage_newly_thatched_%282586986951%29.jpg',
  },
  {
    id: 's05',
    nama: 'Akomodasi Contoh Takengon 01',
    wilayah: 'Aceh Tengah',
    hargaPerMalam: 420000,
    fasilitas: ['Pemandangan dataran tinggi', 'Area parkir (simulasi)'],
    fasilitasRamahMuslim:
      'Informasi fasilitas ibadah merupakan data simulasi dan perlu dikonfirmasi.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Danau_Laut_Tawar%2C_Takengon%2C_Aceh_Tengah.jpg/960px-Danau_Laut_Tawar%2C_Takengon%2C_Aceh_Tengah.jpg',
  },
  {
    id: 's06',
    nama: 'Akomodasi Contoh Bener Meriah 01',
    wilayah: 'Bener Meriah',
    hargaPerMalam: 300000,
    fasilitas: ['Area keluarga', 'Parkir (simulasi)'],
    fasilitasRamahMuslim:
      'Konfirmasi fasilitas ibadah dan layanan makanan sebelum memesan.',
    kontak: 'Kontak simulasi',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/7_Springs_Mountain_resort_-_panoramio.jpg/960px-7_Springs_Mountain_resort_-_panoramio.jpg',
  },
];

/**
 * @typedef {Object} PackageItem
 * @property {string} id
 * @property {string} nama
 * @property {number} durasi
 * @property {string[]} daftarDestinasi
 * @property {number} estimasiBiaya
 * @property {string} deskripsi
 * @property {string[]} minat
 * @property {string} wilayah
 * @property {string} [imageUrl]
 */

/** @type {PackageItem[]} */
export const SEED_PACKAGES = [
  {
    id: 'p01',
    nama: 'Jejak Religi & Sejarah Banda Aceh',
    durasi: 2,
    daftarDestinasi: ['d01', 'd02', 'd03', 'd04'],
    estimasiBiaya: 475000,
    deskripsi: 'Rute ringkas untuk mengenal sejarah kota dan warisan religi.',
    minat: ['religi', 'sejarah', 'budaya'],
    wilayah: 'Banda Aceh',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Meuseujid_Raya_Bayturrahman.JPG/960px-Meuseujid_Raya_Bayturrahman.JPG',
  },
  {
    id: 'p02',
    nama: 'Bahari Sabang & Pulau Weh',
    durasi: 3,
    daftarDestinasi: ['d07', 'd08'],
    estimasiBiaya: 1250000,
    deskripsi:
      'Pengalaman pesisir dan panorama bahari dengan waktu cadangan untuk penyeberangan.',
    minat: ['bahari', 'alam'],
    wilayah: 'Sabang',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Iboih_beach%2C_Sabang%2C_Aceh%3B_August_2010.jpg/960px-Iboih_beach%2C_Sabang%2C_Aceh%3B_August_2010.jpg',
  },
  {
    id: 'p03',
    nama: 'Pesisir Aceh Besar',
    durasi: 2,
    daftarDestinasi: ['d05', 'd06'],
    estimasiBiaya: 550000,
    deskripsi:
      'Eksplorasi pantai dengan penyesuaian pada cuaca dan kondisi laut.',
    minat: ['bahari', 'alam'],
    wilayah: 'Aceh Besar',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Lampuuk.jpg/960px-Lampuuk.jpg',
  },
  {
    id: 'p04',
    nama: 'Dataran Tinggi Gayo',
    durasi: 3,
    daftarDestinasi: ['d09', 'd10', 'd12'],
    estimasiBiaya: 950000,
    deskripsi: 'Panorama danau, perbukitan, dan pengalaman budaya lokal.',
    minat: ['alam', 'budaya'],
    wilayah: 'Aceh Tengah',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Danau_Laut_Tawar_Takengon.jpg/960px-Danau_Laut_Tawar_Takengon.jpg',
  },
  {
    id: 'p05',
    nama: 'Alam Bener Meriah',
    durasi: 2,
    daftarDestinasi: ['d11'],
    estimasiBiaya: 700000,
    deskripsi:
      'Perjalanan alam yang membutuhkan pengecekan jalur, cuaca, dan pemandu.',
    minat: ['alam'],
    wilayah: 'Bener Meriah',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Bayangan_segitiga_gunung_burni_telong_aceh.jpg/960px-Bayangan_segitiga_gunung_burni_telong_aceh.jpg',
  },
];
