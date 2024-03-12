const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const config = require('./config');
require('dotenv').config();
const openai = new OpenAI({
    apiKey: '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',
    endpoint: 'https://api.openai.com'
});

const app = express();
app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Bot sedang berjalan');
});

app.post('/hook/messages', handleNewMessages);

const port = process.env.PORT;
app.listen(port, function () {
    console.log(`Mendengar pada port ${port}...`);
});
// Tentukan langkah-langkah aliran kerja
const steps = {
    START: 'mula',
    WEBSTART:'webstart',
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
            let currentStep = userState.get(sender.to) || steps.WEBSTART;
            
            switch (currentStep) {
                case steps.WEBSTART:
                     // 5 sec delay
                     const webhookResponse2 = await callWebhook('https://hook.us1.make.com/e6rlgyftqf3kebexbomwj3pqaukwytg9',message.text.body,sender.to,sender.name);
                     console.log(webhookResponse2);
                     if (webhookResponse2) { 
                         // Send the response from the webhook to the user
                         await sendWhapiRequest('messages/text', { to: sender.to, body: webhookResponse2 });
                     } else {
                         console.error('No valid response from webhook.');
                     }
     
                     console.log('Response sent.');
                    if(message.text.body.includes("checkout")){
                        userState.set(sender.to, steps.START); // Update user state
                     }
                       
         
                break;

                    case steps.START:
                        // Menangani langkah satu
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Saya pembantu AI dari MADRE untuk menjadikan pengalaman membeli-belah anda lebih baik.' });
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Nampaknya anda membiarkan beberapa item didalam troli anda baru-baru ini:'});
                    const pollParams = {
                        to: sender.to,
                        title: 'Adakah anda ingin meneruskan pembelian untuk item-item ini?',
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
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Ada perkara lain yang boleh saya bantu?' });
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            break;
                        }
                        if(message.action.votes[0]===selectedOption[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Jualan murah untuk item anda!!\n' +
                                'Adakah anda ingin mendapatkan diskaun pada pesanan anda?'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Selesaikan pembelian anda dalam masa satu jam dan dapatkan 10% diskaun!' });
                                const pollParams = {
                                    to: sender.to,
                                    title: 'Adakah anda ingin meneruskan pembelian untuk item-item ini?',
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
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                        break;
                        }
                        if(message.action.votes[0]=== selected_Option[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Hi, saya perasan anda tidak selesaikan pembelian anda\n' +
                                'Boleh tau sebab apa?\n' +
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
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Peluang terakhir! Kasut anda sedang menunggu didalam troli, tetapi kasut tersebut tidak akan berada di situ selamanya.\n' +
                                'Selesaikan pembelian anda sekarang dan terus bergaya!'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                                'https://madre.my/collections/bestsellers'});
                                userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            },5*1000);
                            
                        break;
                        case steps.FINISH:
                                
                const webhookResponse = await callWebhook('https://hook.us1.make.com/e6rlgyftqf3kebexbomwj3pqaukwytg9',message.text.body,sender.to,sender.name);
                
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
   
    const webhookUrl = webhook;
    console.log('Memanggil webhook...'+webhookUrl);
    const body = JSON.stringify({ senderText,senderNumber,senderName }); 
    // Termasuk teks pengirim dalam badan permintaan
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    });
    console.log(response.body);
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


