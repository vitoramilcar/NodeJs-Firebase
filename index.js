const express = require('express');
const app = express();
const admin = require("firebase-admin");
const credentials = require("./key.json");

admin.initializeApp({
credential:admin.credential.cert(credentials)
});

const db =admin.firestore();
app.use(express.text())
 





// Create a reference to the cities collection



// Create a query against the collection


//---------------Dados recebidos do ESP ---------------------------------------------------
 let idesp = "";
 
//--------------------------------------------------------------------------------------------

//---------------Dados time e data-------------------------------------------------------------
let data = new Date();
let diames = data.getDate().toString();
let mesesp = (data.getMonth()+1).toString();
let diasemana = data.getDay() ;
//---------------------------------------------------------------------------------------------

//-------------------------Dados para o Banco de Dados----------------------------------------
const dataesp = {
  hora_chegada:data,
  hora_dia: 0,
  hora_saida: null,
  dia_semana: diasemana,
  hora_semana : 0,
  hora_mes: 0,
  anopasta: data.getFullYear()
};



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
    //console.log(i);

  }

  db.collection('users').doc(idesp).collection(mesesp).doc(diames).update({  //update dos dados no banco de dados
    hora_semana : sumhs,
    hora_mes: sumhm
  })  
}
//----------------------------------------------------------------------------------------------------------------------------
  

 



//--------------------------POST ---------------------------------------------
app.post('/data',async (req,res)=>{

 let idbody = req.body;
 console.log(idbody);
 //idbody = 'VITOR602'
 const usersRef = db.collection('users');
 const queryRef = await usersRef.where('idcard', '==', idbody).get();

 if (queryRef.empty) {
  console.log("Não existe o id" + idbody); 
  res.end("IDinv");
  return;
}

queryRef.forEach(doc => {
  idesp = doc.id
  console.log(idesp + "acho pora")
});


 console.log(idesp + "depois do achar id");
 
 //----------------------------------------------------------------------------------------------------------------------


///* -----------SE o ID EXISTE------------------------------------------------------------------------------------------------
db.collection('users').doc(idesp).get().then(async function(doc){
  if(doc.exists){ 

    console.log("existe o id " + idesp);
    
    let dadosUsers = doc.data();
    

    //----verifica se existe a coleção do dia pro primeiro registro, se existir atualiza o segundo registro
   await db.collection('users').doc(idesp).collection(mesesp).doc(diames).get().then( async function(doc){

    let dadosdia = doc.data();   // Dados do dia do Usuario.

    if(doc.exists  && dadosdia.anopasta == data.getFullYear()){
      
      console.log("existe a pasta  e o ano" + diames);
      
      
      await db.collection('users').doc(idesp).collection(mesesp).doc(diames).update({  //update dos dados no banco de dados
        hora_saida: new Date(),
        hora_dia:  Date.now() - dadosdia.hora_chegada.toDate()
      })  
      
      calc_hshm();  // função para calcular hora da semana, hora do mês;
      
      console.log("update na pasta " + diames);

      res.end("BYE: " + dadosUsers.nome);
      
    }

    else{      // SE NÃO EXISTIR A COLEÇÃO , CRIA E COLOCA O PRIMEIRO HORARIO

      console.log("Não existe a pasta " + diames);
      db.collection('users').doc(idesp).collection(mesesp).doc(diames).set(dataesp);

      res.end("HI: " + dadosUsers.nome);
      
    }
  });
  }

});

//*///------------------------------------------------------------------------------------------

})

app.get('/',(req,res)=>{

res.send('<h1> JOSE</h1>');




})

app.listen (8080,()=>{

    console.log('Servidor Aberto 8080');
})