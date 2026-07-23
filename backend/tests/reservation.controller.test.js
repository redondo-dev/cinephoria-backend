// tests/reservation.controller.test.js

import request from "supertest";
import { jest } from "@jest/globals";


// ======================================================
// MOCK AUTH MIDDLEWARE
// ======================================================

await jest.unstable_mockModule(
  "../src/middleware/auth.middleware.js",
  () => ({

    authenticate: (req, res, next) => {
      req.user = {
        id: 1,
        role: "CLIENT"
      };
      next();
    },


    verifyToken: (req, res, next) => {
      req.user = {
        id: 1,
        role: "CLIENT"
      };
      next();
    },


    requireConfirmedAccount:
      (req,res,next)=>next(),


    checkMustChangePassword:
      (req,res,next)=>next(),


    authorizeRoles:
      () => (req,res,next)=>next(),


    isAdmin:
      (req,res,next)=>next(),


    isEmploye:
      (req,res,next)=>next(),


    isClient:
      (req,res,next)=>next(),


    isVisiteur:
      (req,res,next)=>next(),


    isAdminOrEmploye:
      (req,res,next)=>next()

  })
);




// ======================================================
// MOCK MODELS SEQUELIZE
// ======================================================


const Reservation = {

  create: jest.fn(),

  findAll: jest.fn(),

  findByPk: jest.fn(),

  update: jest.fn(),

  destroy: jest.fn()

};



await jest.unstable_mockModule(
  "../src/models/index.js",
  () => ({

    Reservation,


    User:{
      findByPk:jest.fn(),
      findOne:jest.fn()
    },


    Role:{},


    Cinema:{},

    Film:{},

    Seance:{},

    Salle:{},

    Siege:{},

    Genre:{},

    Avis:{},

    Incident:{},

    FilmGenre:{},


    sequelize:{

      authenticate:jest.fn(),

      sync:jest.fn()

    }

  })
);




// ======================================================
// MOCK STRIPE
// ======================================================


await jest.unstable_mockModule(
  "stripe",
  ()=>({

    default:jest.fn(()=>({

      paymentIntents:{

        create:jest.fn(),

        retrieve:jest.fn()

      }

    }))

  })
);




// ======================================================
// IMPORT APP APRES LES MOCKS
// ======================================================


const {default:app}=await import(
  "../src/app.js"
);




// ======================================================
// TESTS CRUD RESERVATION
// ======================================================



describe("POST /api/reservations",()=>{


test("Crée une réservation avec succès",async()=>{


const newReservation={

 id:1,

 utilisateur_id:null,

 seance_id:2,

 nb_places:3,

 prix_unitaire:10

};



Reservation.create
.mockResolvedValue(newReservation);



const response =
await request(app)
.post("/api/reservations")
.send({

 seance_id:2,

 nb_places:3,

 prix_unitaire:10

});



expect(response.statusCode)
.toBe(201);



expect(response.body)
.toEqual(newReservation);



expect(Reservation.create)
.toHaveBeenCalled();



});





test("Retourne 400 si champs obligatoires manquants",async()=>{


const response =
await request(app)
.post("/api/reservations")
.send({

nb_places:3

});



expect(response.statusCode)
.toBe(400);



expect(response.body.message)
.toContain(
"Champs obligatoires"
);



});





test("Retourne 500 erreur serveur",async()=>{


Reservation.create
.mockRejectedValue(
new Error("Erreur DB")
);



const response =
await request(app)
.post("/api/reservations")
.send({

seance_id:2,

nb_places:3,

prix_unitaire:10

});



expect(response.statusCode)
.toBe(500);



});


});








describe("GET /api/reservations",()=>{


test("Retourne toutes les réservations",async()=>{


const reservations=[

{

id:1,

seance_id:2

}

];



Reservation.findAll
.mockResolvedValue(reservations);



const response =
await request(app)
.get("/api/reservations");



expect(response.statusCode)
.toBe(200);



expect(response.body)
.toEqual(reservations);



expect(Reservation.findAll)
.toHaveBeenCalled();



});





test("Erreur serveur",async()=>{


Reservation.findAll
.mockRejectedValue(
new Error("Erreur DB")
);



const response =
await request(app)
.get("/api/reservations");



expect(response.statusCode)
.toBe(500);



});


});









describe("GET /api/reservations/:id",()=>{


test("Retourne une réservation",async()=>{


const reservation={

id:1,

seance_id:2

};



Reservation.findByPk
.mockResolvedValue(reservation);



const response =
await request(app)
.get("/api/reservations/1");



expect(response.statusCode)
.toBe(200);



expect(response.body)
.toEqual(reservation);



});






test("404 si inexistante",async()=>{


Reservation.findByPk
.mockResolvedValue(null);



const response =
await request(app)
.get("/api/reservations/99");



expect(response.statusCode)
.toBe(404);



});


});










describe("PUT /api/reservations/:id",()=>{


test("Modification réussie",async()=>{


Reservation.update
.mockResolvedValue([1]);



Reservation.findByPk
.mockResolvedValue({

id:1,

nb_places:4

});



const response =
await request(app)
.put("/api/reservations/1")
.send({

nb_places:4

});



expect(response.statusCode)
.toBe(200);



expect(Reservation.update)
.toHaveBeenCalled();



});


});









describe("DELETE /api/reservations/:id",()=>{


test("Suppression réussie",async()=>{


Reservation.destroy
.mockResolvedValue(1);



const response =
await request(app)
.delete("/api/reservations/1");



expect(response.statusCode)
.toBe(200);



expect(response.body.message)
.toContain(
"supprimée"
);



});






test("404 si inexistante",async()=>{


Reservation.destroy
.mockResolvedValue(0);



const response =
await request(app)
.delete("/api/reservations/99");



expect(response.statusCode)
.toBe(404);



});


});