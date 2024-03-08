const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const config = require('./config');

const openai = new OpenAI({
    apiKey: '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',
    endpoint: 'https://api.openai.com'
});

const app = express();
app.use(bodyParser.json());

// Tentukan langkah-langkah aliran kerja
const steps = {
    START: 'mula',
    STEP_ONE: 'langkah_satu',
    STEP_TWO: 'langkah_dua',
    STEP_THREE: 'langkah_tiga',
    STEP_FOUR: 'langkah_empat',
    FINISH: 'siap'
};

// Simpan keadaan pengguna (langkah semasa)
const userState = new Map();

async function handleNewMessages(req, res) {
    const MADRE_AGENT_ID = '';
    try {
   
        const receivedMessages = req.body.messages;
        //console.log('Menangani mesej-mesej baru...',receivedMessages);
        for (const message of receivedMessages) {
            if (message.from_me) break;

            const sender = {
                to: message.chat_id,
                name: message.from_name
            };

            // Dapatkan langkah semasa atau tetapkan ke MULA jika tidak ditakrifkan
            let currentStep = userState.get(sender.to) || steps.START;
            
            switch (currentStep) {
               

                    case steps.START:
                        // Menangani langkah satu
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Saya pembantu yang membantu dari MADRE untuk menjadikan pengalaman membeli-belah anda sebaik mungkin.' });
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Nampaknya anda meninggalkan beberapa item dalam troli anda baru-baru ini:'});
                    const pollParams = {
                        to: sender.to,
                        title: 'Adakah anda ingin meneruskan membeli-belah untuk item-item ini?',
                        options: ['Ya', 'Tidak'],
                        count: 1,
                        view_once: true
                    };
                    webhook = await sendWhapiRequest('/messages/poll', pollParams);
                    console.log('result',webhook.message.poll.results);
                    userState.set(sender.to, steps.STEP_TWO); // Kemaskini keadaan pengguna
                    break;
                    
                    case steps.STEP_TWO:
                        
                        let selectedOption = [];
                        for (const result of webhook.message.poll.results) {
                            selectedOption.push (result.id);
                        }
                        
                        if(message.action.votes[0]=== selectedOption[0])
                        {
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk menyelesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Adakah ada yang lain yang saya boleh bantu?' });
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            break;
                        }
                        if(message.action.votes[0]===selectedOption[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Item anda ada DIJUAL!\n' +
                                'Adakah anda ingin mendapatkan diskaun pada pesanan anda?'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Selesaikan pembelian anda dalam masa satu jam akan mendapatkan 10% diskaun!' });
                                const pollParams = {
                                    to: sender.to,
                                    title: 'Adakah anda ingin meneruskan membeli-belah untuk item-item ini?',
                                    options: ['Ya', 'Tidak'],
                                    count: 1,
                                    view_once: true
                                };
                                webhook = await sendWhapiRequest('/messages/poll', pollParams);
                                console.log('result',webhook.message.poll.results);
                                userState.set(sender.to, steps.STEP_THREE); // Kemaskini keadaan pengguna
                            },5 * 1000); //timer 5 saat
                            
                        break;
                        }
                        
                        case steps.STEP_THREE:

                        let selected_Option = [];
                        for (const result of webhook.message.poll.results) 
                        {
                            selected_Option.push (result.id);
                        }
                        if(message.action.votes[0]=== selected_Option[0])
                        {
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Gembira mendengarnya!' });
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Jangan biarkan kasut itu terlepas! Selesaikan pembelian anda sekarang dan nikmati diskaun istimewa 10%. Gunakan kod CART10 semasa pembayaran.'});
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk menyelesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                        break;
                        }
                        if(message.action.votes[0]=== selected_Option[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Hi, saya perasan anda tidak menyelesaikan pembelian anda\n' +
                                'Bolehkah anda beritahu saya jika ada sebab tertentu?\n' +
                                'Anda boleh memilih dari pilihan di bawah'});
                                const pollParams = {
                                  to: sender.to,
                                  title: 'Sila pilih',
                                  options: ['Ubah fikiran saya', 'Belum bersedia untuk membeli', 'Kerisauan Harga'],
                                  count: 1,
                                  view_once: true
                                };
                                webhook = await sendWhapiRequest('/messages/poll', pollParams);
                                console.log('result',webhook.message.poll.results);
                                userState.set(sender.to, steps.STEP_FOUR); // Kemaskini keadaan pengguna
                            },5* 1000);
                            break;
                        }

                        case steps.STEP_FOUR:
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Peluang terakhir! Kasut anda menunggu dengan sabar dalam troli anda, tetapi mereka tidak akan berada di sana selamanya.\n' +
                                'Selesaikan pembelian anda sekarang dan masuk ke dalam gaya!'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk menyelesaikan pembelian anda:\n' + 
                                'https://madre.my/collections/bestsellers'});
                                userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            },5*1000);
                            
                        break;
                        case steps.FINISH:
                                
                const webhookResponse = await callWebhook('https://hook.us1.make.com/knfsaagv5tnfrx2j752l9c6cajk7pxb6',message.text.body,sender.to,sender.name);
                
                if (webhookResponse) {
                    // Send the response from the webhook to the user
                    await sendWhapiRequest('messages/text', { to: sender.to, body: webhookResponse });
                } else {
                    console.error('No valid response from webhook.');
                }
                break;
                default:
                    // Menangani langkah yang tidak dikenali
                    console.error('Langkah yang tidak dikenali:', currentStep);
                    break;
            }
        }

        res.send('Semua mesej diproses');
    } catch (e) {
        console.error('Ralat:', e.message);
        res.status(500).send('Ralat Server Dalaman');
    }
}
async function callWebhook(webhook,senderText,senderNumber,senderName) {
    console.log('Memanggil webhook...');
    const webhookUrl = webhook;
    const body = JSON.stringify({ senderText,senderNumber,senderName }); // Termasuk teks pengirim dalam badan permintaan
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    });
    const responseData = await response.text(); // Dapatkan respons sebagai teks
    console.log('Respon webhook:', responseData); // Log respon mentah
 return responseData;
}

async function sendWhapiRequest(endpoint, params = {}, method = 'POST') {
    console.log('Menghantar permintaan ke Whapi.Cloud...');
    const options = {
        method: method,
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    };
    const url = `${config.apiUrl}/${endpoint}`;
    const response = await fetch(url, options);
    const jsonResponse = await response.json();
    console.log('Respon Whapi:', JSON.stringify(jsonResponse, null, 2));
    return jsonResponse;
}

app.get('/', function (req, res) {
    res.send('Bot sedang berjalan');
});

app.post('/hook/messages', handleNewMessages);

const port = config.port || (config.botUrl.indexOf('https:') === 0 ? 443 : 80);
app.listen(port, function () {
    console.log(`Mendengar pada port ${port}...`);
});
