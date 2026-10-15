#!/usr/bin/env bash
# API smoke test for the Journey Platform (dev only).
set -e
B=http://localhost:4000/api
J='-H Content-Type:application/json'
echo "== register =="
curl -s -c /tmp/u.jar $J -d '{"email":"smoke@test.dev","password":"Test1234!","fullName":"Smoke Tester"}' $B/auth/register | head -c 200; echo
echo "== journeys (published only) =="
curl -s $B/journeys | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('count:',j.journeys.length, '| first:', j.journeys[0].title, j.journeys[0].price)})"
echo "== search filter q=atlas =="
curl -s "$B/journeys?q=atlas" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).journeys.map(j=>j.title).join(', '))})"
JID=$(curl -s "$B/journeys?q=atlas" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).journeys[0].id)})")
echo "== booking (journey $JID, 2 travellers) =="
curl -s -b /tmp/u.jar $J -d "{\"journeyId\":$JID,\"travellersCount\":2}" $B/bookings > /tmp/booking.json
node -e "const b=require('/tmp/booking.json').booking;console.log(b.reference,b.totalPrice,b.status,b.paymentStatus)"
BID=$(node -e "console.log(require('/tmp/booking.json').booking.id)")
echo "== simulated payment success =="
curl -s -b /tmp/u.jar $J -d '{"simulate":"success"}' $B/bookings/$BID/pay | head -c 150; echo
echo "== duplicate payment attempt (expect 409) =="
curl -s -b /tmp/u.jar -o /dev/null -w '%{http_code}\n' $J -d '{"simulate":"success"}' $B/bookings/$BID/pay
echo "== other user cannot read booking (expect none/anon 401) =="
curl -s -o /dev/null -w '%{http_code}\n' $B/bookings/$BID
echo "== booking history =="
curl -s -b /tmp/u.jar $B/bookings | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('bookings:',j.bookings.length,'| ref:',j.bookings[0].reference, j.bookings[0].paymentStatus)})"
echo "== create itinerary draft + put items =="
curl -s -b /tmp/u.jar $J -d '{"title":"Test draft"}' $B/itineraries > /tmp/it.json
IID=$(node -e "console.log(require('/tmp/it.json').itinerary.id)")
O1=$(curl -s "$B/options?category=activity" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).options[0].id)})")
curl -s -b /tmp/u.jar $J -X PUT -d "{\"items\":[{\"optionId\":$O1,\"quantity\":2}]}" $B/itineraries/$IID | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const i=JSON.parse(d).itinerary;console.log('items:',i.items.length,'total:',i.totalPrice)})"
echo "== submit quote request =="
curl -s -b /tmp/u.jar -X POST $B/itineraries/$IID/quote | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log('quote status:',JSON.parse(d).quoteRequest.status)})"
echo "== non-admin blocked from quote review (expect 403) =="
curl -s -b /tmp/u.jar -o /dev/null -w '%{http_code}\n' $B/admin/quote-requests
echo "== admin login + quote review =="
curl -s -c /tmp/a.jar $J -d '{"email":"admin@journey.demo","password":"Demo1234!"}' $B/auth/login | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log('role:',JSON.parse(d).user.role)})"
curl -s -b /tmp/a.jar $B/admin/quote-requests | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const q=JSON.parse(d).quoteRequests;console.log('quotes:',q.length,'| status:',q[0].status,'| total:',q[0].indicatedTotal)})"
QID=$(curl -s -b /tmp/a.jar $B/admin/quote-requests | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).quoteRequests[0].id)})")
echo "== admin updates quote status =="
curl -s -b /tmp/a.jar $J -X PATCH -d '{"status":"in_review","agentNote":"checking options"}' $B/admin/quote-requests/$QID | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const q=JSON.parse(d).quoteRequest;console.log('updated:',q.status,'-',q.agentNote)})"
echo "== admin creates a journey =="
curl -s -b /tmp/a.jar $J -d '{"title":"Test Tour (admin)","destination":"Agadir, Morocco","start_date":"2027-03-01","end_date":"2027-03-05","price":299.99,"capacity":10}' $B/journeys | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d).journey;console.log('created id:',j.id,'status:',j.status,'price:',j.price)})"
echo "ALL SMOKE TESTS DONE"
