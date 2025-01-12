/* 


 (JavaScript) - "Virtual League Standings System" Project:
  Welcome to the Virtual League Standings System project! 
  This project is a Node.js application designed to manage and display the standings of a virtual sports league. 
  It allows users to manually input match results or read them from a file, and then processes these results to update the league standings accordingly.

*/

const fs = require('fs'); // node.js'in yerleşik (built-in) fs (File System) modülüyle gelen bir fonksiyon. dosya sistemi ile etkileşimde bulunmak için kullanılır.
const readline = require('readline'); // node.js built-in readline() modülü ve async/await ve promise. kullanıcıdan terminal üzerinden giriş almak için kullanılır.

// JSON dosyalarını okuma
const ayarlar = JSON.parse(fs.readFileSync('ayarlar.json', 'utf8')); // utf8: dosyayı okurken karakter seti belirleme.
const takimlar = JSON.parse(fs.readFileSync('takimlar.json', 'utf8')); // parse: JSON verisini javaScript nesnesine dönüştürme.

class TakimIstatistik { // takım istatistiklerini tutan sınıf.
    constructor(kisaAd, uzunAd) { // Her takım için istatistiklerin tutulacağı propertiesleri başlatır ve başlangıç değerlerini atar.
        this.kisaAd = kisaAd; // this: sınıfın örneklerini temsil eder, sınıfın içindeki değişkenlere erişmek için kullanılır.
        this.uzunAd = uzunAd;
        this.macSayisi = 0;
        this.galibiyet = 0;
        this.beraberlik = 0;
        this.maglubiyet = 0;
        this.attigiGol = 0;
        this.yedigiGol = 0;
        this.puan = 0;
        this.averaj = 0;
        this.oynananMaclar = new Set(); // aynı maçın tekrar girilmesini engellemek için Set nesnesine maç kodlarını ekler.
    }
}

class LigYoneticisi { // ligdeki takımların maç sonuçlarını işleyen, puan durumunu gösteren, dosyadan maç sonuçlarını okuyan sınıf.
    constructor() {
        this.takimIstatistikleri = new Map();
        this.ayarlar = ayarlar; // ayarlar.json dosyasındaki ayarları alır.

        takimlar.forEach(takim => {// takımları başlangıç değerleriyle oluşturur ve takım istatistiklerini map'e ekler. 
            this.takimIstatistikleri.set(
                takim.takimKisaAdi, // takimlar.json dosyasındaki takım kısa adlarını alır. 
                new TakimIstatistik(takim.takimKisaAdi, takim.takimAdi)
            );
        });
    }

    macSonucunuIsle(evSahibi, evSahibiGol, deplasman, deplasmanGol) { // maç sonuçlarını tabloya işler.
        if (!this.takimIstatistikleri.has(evSahibi) || !this.takimIstatistikleri.has(deplasman)) { // takım kodlarının doğruluğu kontrolü. .has:
            console.log('Hata: Geçersiz takım girişi. Yalnızca geçerli takım kodlarını girebilirsiniz.');
            console.log('Geçerli takım kodları:');
            this.takimIstatistikleri.forEach((takim) => { // takımların adlarını listeler.
                console.log(`${takim.kisaAd} (${takim.uzunAd})`);
            });
            return false;
        }

        if (!Number.isInteger(evSahibiGol) || !Number.isInteger(deplasmanGol)) { // gol sayılarının doğal sayı olup olmadığı kontrolü.
            console.log('Hata: Geçersiz gol girişi. Yalnızca doğal sayı gol girişi yapabilirsiniz.');
            return false;
        }

        if (evSahibiGol < 0 || deplasmanGol < 0) { // gol sayılarının negatif olup olmadığı kontrolü.
            console.log('Hata: Geçersiz gol girişi. Yalnızca doğal sayı gol girişi yapabilirsiniz.');
            return false;
        }

        if (evSahibi === deplasman) { // aynı takımlar arasında maç yapılmaz kontr
            console.log('Hata: Geçersiz maç girişi. Yalnızca farklı takımlar arasında maç yapabilirsiniz.');
            return false;
        }

        const macKodu = `${evSahibi}-${deplasman}`; //  A-B gibi bir kod oluşturur, aynı maçın tekrar girilmesini engeller.
        const evSahibiTakim = this.takimIstatistikleri.get(evSahibi);
        const deplasmanTakim = this.takimIstatistikleri.get(deplasman); //erişmek için

        if (evSahibiTakim.oynananMaclar.has(macKodu)) { // maç daha önce oynandı mı kontrolü.
            console.log('Hata: Geçersiz maç girişi. Yalnızca oynanmamış maçlar için giriş yapabilirsiniz.');
            return false;
        }

        // maç sonuçlarını kaydet.
        evSahibiTakim.macSayisi++;
        deplasmanTakim.macSayisi++;
        evSahibiTakim.attigiGol += evSahibiGol;
        evSahibiTakim.yedigiGol += deplasmanGol;
        deplasmanTakim.attigiGol += deplasmanGol;
        deplasmanTakim.yedigiGol += evSahibiGol;

        // galibiyet, beraberlik, mağlubiyet durumlarını hesapla.
        if (evSahibiGol > deplasmanGol) {
            evSahibiTakim.galibiyet++;
            deplasmanTakim.maglubiyet++;
            evSahibiTakim.puan += this.ayarlar.galibiyetPuan;
            deplasmanTakim.puan += this.ayarlar.maglubiyetPuan;
        } else if (evSahibiGol < deplasmanGol) {
            evSahibiTakim.maglubiyet++;
            deplasmanTakim.galibiyet++;
            evSahibiTakim.puan += this.ayarlar.maglubiyetPuan;
            deplasmanTakim.puan += this.ayarlar.galibiyetPuan;
        } else {
            evSahibiTakim.beraberlik++;
            deplasmanTakim.beraberlik++;
            evSahibiTakim.puan += this.ayarlar.beraberlikPuan;
            deplasmanTakim.puan += this.ayarlar.beraberlikPuan;
        }

        // averajları güncelle.
        evSahibiTakim.averaj = evSahibiTakim.attigiGol - evSahibiTakim.yedigiGol;
        deplasmanTakim.averaj = deplasmanTakim.attigiGol - deplasmanTakim.yedigiGol;

        evSahibiTakim.oynananMaclar.add(macKodu); // aynı maçın tekrar girilmesini engellemek için mackodu setine oynanan maçları ekle.

        return true;
    }

    puanDurumuGoster(siralamaMetodu = 'puan', buyukHarf = false) { // varsayılan sıralama metodu puan ve büyük harf yok.
        let takimlar = Array.from(this.takimIstatistikleri.values()); // takimIstatistikleri map'ini  diziye çevirir. sort fonksiyonu sadece dizilerde çalışır.

        switch (siralamaMetodu) { // seçilen sıralama metoduna göre sıralamak için switch-case.
            case 'puan':
            case 'puan':
            case '1':
                takimlar.sort((a, b) => b.puan - a.puan || b.averaj - a.averaj); // sort: diziyi sıralar.
                break;
            case 'alfabetik':
            case '2':
                takimlar.sort((a, b) => a.uzunAd.localeCompare(b.uzunAd)); // localeCompare: iki stringi yerel ayarlara duyarlı bir şekilde karşılaştırmak için kullanılır.
                break;
            case 'takmaIsim':
            case '3':
                takimlar.sort((a, b) => a.kisaAd.localeCompare(b.kisaAd));
                break;
            default:
                console.log('Hata: Geçersiz seçim. Yalnızca 1, 2 veya 3 seçeneklerini seçebilirsiniz.');
                return;
        }

        console.log('\nPuan Durumu:'); // puan durumu tablosunu yazdırmaya başlatan kısım.
        console.log('Takım\tUzun İsim\tO\tG\tB\tM\tAG\tYG\tAV\tP'); // tablo başlıkları.
        console.log('-'.repeat(80)); // tablo başlıklarının altına çizgi çizdirme. repeat: belirtilen karakteri belirtilen sayıda tekrarlar.

        takimlar.forEach(takim => { // takımların istatistiklerini yazdıran kısım. 
            const uzunIsim = buyukHarf ? takim.uzunAd.toUpperCase() : takim.uzunAd;
            console.log(
                `${takim.kisaAd}\t${uzunIsim.padEnd(12)}\t` + // padEnd: stringin sağ tarafına ne kadar boşluk ekleyeceğini belirler.
                `${takim.macSayisi}\t${takim.galibiyet}\t${takim.beraberlik}\t` + // \t: tab boşluğu ekler.
                `${takim.maglubiyet}\t${takim.attigiGol}\t${takim.yedigiGol}\t` +
                `${takim.averaj}\t${takim.puan}`
            );
        });
    }

    dosyadanMaclariOku(dosyaAdi) { // dosyadan maç sonuçlarını okuyan "LigYoneticisi" classı fonksiyonu.

        if (!fs.existsSync(dosyaAdi)) {  // existsSync: dosyanın var olup olmadığını kontrol eder. node.js'in yerleşik (built-in) fs (File System) modülüyle gelen bir fonksiyon.
            console.log('Hata: Geçersiz dosya adı girişi. Lütfen dosya adını kontrol edin.');
            return;
        }

        if (!dosyaAdi.toLowerCase().endsWith('.txt')) {// Dosya adının .txt ile bitip bitmediğini kontrol et
            console.log('Hata: Geçersiz dosya formatı. Yalnızca ".txt" uzantılı dosyalar kabul edilir.');
            return;
        }

        const maclar = fs.readFileSync(dosyaAdi, 'utf8').split('\n'); // dosyayı satır satır okur ve satırları diziye atar. split: stringi belirtilen karaktere göre böler ve diziye atar.

        maclar.forEach(mac => { // dosyadan okunan maçları parçalara ayırır, boş satırları atlar ve maç sonuçlarını işler.
            const parcalar = mac.trim().split(' ');

            if (mac.trim() === '') return; // boş satırları atlar.

            // gol değerlerinin sayı olup olmadığını kontrol et. parsefloat: stringi ondalıklı sayıya dönüştürür.
            if (isNaN(parcalar[1]) || isNaN(parcalar[3]) || !Number.isInteger(parseFloat(parcalar[1])) || !Number.isInteger(parseFloat(parcalar[3]))) {
                console.log('Hata: Geçersiz giriş. Yalnızca doğru formatta ve gol değerleri doğal sayı olan maç girişi yapabilirsiniz.');
                return;
            }

            if (parcalar.length === 4) { // maç sonuçlarını tabloya işler.
                const [evSahibi, evSahibiGol, deplasman, deplasmanGol] = parcalar;
                this.macSonucunuIsle(
                    evSahibi.toUpperCase(), // toUpperCase: stringi büyük harfe dönüştürür. dosyadan küçük harfle maç girişi yapılabilmesini sağlar.
                    parseInt(evSahibiGol), // parseInt: stringi tam sayıya dönüştürür.
                    deplasman.toUpperCase(),
                    parseInt(deplasmanGol)
                );
            }
        });
    }
}

// kullanıcı arayüzü. node.js built-in readline() modülü ve async/await ve promise kullanarak çalışır.
const rl = readline.createInterface({ // createInterface: readline modülünden bir arayüz oluşturur ve readline modülüyle gelen fonksiyonları kullanmamızı sağlar. 
    input: process.stdin, // process: node.js'in global nesnesi, stdin: standart giriş.
    output: process.stdout // stdout: standart çıkış. 
});

const lig = new LigYoneticisi(); // "LigYoneticisi" sınıfından bir örnek oluşturur.

function menuGoster() { // kullanıcıya menüyü gösteren fonksiyon.
    console.log('\n1. Manuel Olarak Maç Sonucu Gir');
    console.log('2. Dosyadan Maç Sonuçlarını Oku');
    console.log('3. Puan Tablosunu Göster');
    console.log('4. Çıkış');
    rl.question('Seçiminiz: ', (secim) => { // kullanıcıdan seçim yapmasını ister. question: kullanıcıdan giriş alır. secim: kullanıcının girdiği değeri temsil eder.
        switch (secim) {
            case '1':
                rl.question('Maç sonucunu giriniz. (Örnek: A 6 C 1) ', (sonuc) => {
                    const parcalar = sonuc.split(' ');
                    if (parcalar.length === 4) { // maç sonucunu parçalara ayırır ve doğru formatta girilip girilmediğini kontrol eder. length: dizinin eleman sayısını döndürür.
                        const [ev, evGol, dep, depGol] = parcalar;
                        const evSahibi = ev.toUpperCase();
                        const deplasman = dep.toUpperCase();

                        if (!isNaN(evGol) && !isNaN(depGol) && Number.isInteger(parseFloat(evGol)) && Number.isInteger(parseFloat(depGol))) { // gol sayılarının doğal sayı olup olmadığını kontrol eder.
                            const sonuc = lig.macSonucunuIsle(evSahibi, parseInt(evGol), deplasman, parseInt(depGol));
                            if (sonuc) {
                                console.log(`✓ Maç sonucu kaydedildi: ${evSahibi} ${evGol} ${deplasman} ${depGol}`);
                            }
                        } else {
                            console.log('Hata: Geçersiz giriş. Yalnızca doğal sayı gol girişi yapabilirsiniz.');
                        }
                    } else {
                        console.log('Hata: Geçersiz giriş. Yalnızca doğru formatta giriş yapabilirsiniz. (Örnek: A 6 C 1)');
                    }
                    menuGoster(); // menüyü tekrar gösterir.
                });
                break;
            case '2':
                rl.question('Maç sonuçlarının bulunduğu dosyanın adını giriniz: ', (dosyaAdi) => {
                    lig.dosyadanMaclariOku(dosyaAdi);
                    menuGoster();
                });
                break;
            case '3':
                rl.question('Sıralama metodu seçiniz: (1 - puan / 2 - alfabetik / 3 - takmaIsim) ', (metod) => {
                    rl.question('Büyük harf kullanılsın mı? (E - Evet / H - Hayır): ', (buyukHarf) => {
                        if (buyukHarf.toUpperCase() === 'E' || buyukHarf.toUpperCase() === 'H') {
                            lig.puanDurumuGoster(metod, buyukHarf.toUpperCase() === 'E');
                        } else {
                            console.log('Hata: Geçersiz giriş. Yalnızca "E" veya "H" girebilirsiniz.');
                        }
                        menuGoster();
                    });
                });
                break;
            case '4':
                rl.close();
                break;
            default:
                console.log('Hata: Geçersiz seçim. Yalnızca 1, 2, 3 veya 4 işlemlerini seçebilirsiniz.');
                menuGoster();
                break;
        }
    });
}

console.log('- Sanal Lig Puan Durumu Sistemi -');
menuGoster();
/* 

*/