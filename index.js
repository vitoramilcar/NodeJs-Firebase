const express = require('express');  
const app = express();
const admin = require("firebase-admin");  
const credentials = require("./key.json"); 

admin.initializeApp({
credential:admin.credential.cert(credentials)
});

const db =admin.firestore();
app.use(express.text())
 

//--------------------------Variavel do ID ---------------------------------------------------
let idesp = "";
 
//--------------------------------------------------------------------------------------------

//---------------Dados time e data-------------------------------------------------------------
let data = new Date();
let diames = data.getDate().toString();
let mesesp = (data.getMonth()+1).toString() + + data.getFullYear().toString()
let diasemana = data.getDay() ;

console.log(mesesp)
//---------------------------------------------------------------------------------------------


 //---------Função Calcula hora da semana e hora do mês-------------------------------------------
 async function calc_hshm(){

  let sumhs = 0;
  let sumhm = 0;

  for(i=diasemana;i>=0; i--){

    let auxdmes = diames - i;
  
    await db.collection('users').doc(idesp).collection(mesesp).doc(auxdmes.toString()).get().then(function(doc){

      const dadosaux =doc.data();
      
      if(doc.exists){

        sumhs = dadosaux.hora_dia + sumhs;
        console.log(auxdmes + "primeiro for");

      }

    })
    //console.log(i);
  }

  for(i=diames;i>=0; i--){

    let auxdmes = diames - i;
  
     
    await db.collection('users').doc(idesp).collection(mesesp).doc(auxdmes.toString()).get().then(function(doc){

      const dadosaux =doc.data();
      
      if(doc.exists){

        sumhm = dadosaux.hora_dia + sumhm;
        console.log(auxdmes);

      }
    })
    
  }
  
  db.collection('users').doc(idesp).collection(mesesp).doc(diames).update({  //update dos dados no banco de dados
    hora_semana : sumhs,
    hora_mes: sumhm,
    
  })  
}
//----------------------------------------------------------------------------------------------------------------------------
  
//--------------------------POST ----------------------------------------------------------------------
app.post('/data',async (req,res)=>{         //Caminho do Post do HTTP

 let idbody = req.body;
 console.log(idbody);
 const usersRef = db.collection('users');
 const queryRef = await usersRef.where('idcard', '==', idbody).get(); // Encontra se o ID esta registrado

 if (queryRef.empty) {                 // Se não achar o Id em users, retorna uma resposta para o esp32 , ID não idenfiticado e encerra.
  console.log("Não existe o id" + idbody); 
  res.end("IDinv");
  return;
}

queryRef.forEach(doc => {          // se achar o ID , atribuiu o id uid do authenticador do firebase para a variavel idesp. 
  idesp = doc.id
  console.log(idesp + "acho")
});

 //----------------------------------------------------------------------------------------------------------------------


///* -----------SE o ID EXISTE------------------------------------------------------------------------------------------------
db.collection('users').doc(idesp).get().then(async function(doc){
  if(doc.exists){ 

    console.log("existe o id " + idesp);
    
    let dadosUsers = doc.data();
    
//----verifica se existe a coleção do dia pro primeiro registro, se existir atualiza o segundo registro
   await db.collection('users').doc(idesp).collection(mesesp).doc(diames).get().then( async function(doc){

    let dadosdia = doc.data();   // Dados do dia do Usuario.

    if(doc.exists  ){   // se o documento existir , vai atualizar o segundo horario e chamar a funcão de calculo de horas
      
      console.log("existe a pasta  e o ano" + diames);
      
      
      await db.collection('users').doc(idesp).collection(mesesp).doc(diames).update({  //update dos dados no banco de dados
        hora_saida: new Date(),
        hora_dia:  Date.now() - dadosdia.hora_chegada.toDate()  //subtrai a hora de chegada e a de saida e guarda na variavel hora_dia
      })  
      
      calc_hshm();  // função para calcular hora da semana, hora do mês;
      
      console.log("update na pasta " + diames);

      res.end("BYE: " + dadosUsers.nome);  // manda a msg pro esp32 "BYE: "Nome do usuario" " 
      
    }

    else{      // SE NÃO EXISTIR A COLEÇÃO , CRIA  E COLOCA O PRIMEIRO HORARIO , Junto com os dados

      console.log("Não existe a pasta " + diames);

//-------------------------Dados para o Banco de Dados----------------------------------------
      const dataesp = {
      hora_chegada:new Date(),
      hora_dia: 0,
      hora_saida: null,
      dia_semana: diasemana,
      hora_semana : 0,
      hora_mes: 0,
      anopasta: data.getFullYear(),
      mespasta:(data.getMonth()+1),
      diamespasta:data.getDate(),
      userid:idesp,
      nomec:dadosUsers.nome+" "+dadosUsers.sobrenome,
      meta:dadosUsers.meta
    };

      await db.collection('users').doc(idesp).collection(mesesp).doc(diames).set(dataesp);
      calc_hshm();  // função para calcular hora da semana, hora do mês;
      console.log(idesp +"criando a pasta")

      res.end("HI: " + dadosUsers.nome);
      
    }
  });
  }

});

//------------------------------------------------------------------------------------------

})

app.listen (8080,()=>{

    console.log('Servidor Aberto 8080');
})