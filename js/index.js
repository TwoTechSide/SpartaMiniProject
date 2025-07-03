// Firebase SDK 라이브러리 가져오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase 구성 정보 설정
const firebaseConfig = {
  apiKey: "AIzaSyAUjCKERRTPH6kcmbW-cyEirSTW6SfivCQ",
  authDomain: "spartaminiproject-8c1e4.firebaseapp.com",
  projectId: "spartaminiproject-8c1e4",
  storageBucket: "spartaminiproject-8c1e4.firebasestorage.app",
  messagingSenderId: "1006694549228",
  appId: "1:1006694549228:web:c86739b1a0acdb96d547c9",
  measurementId: "G-92P7CY7JRK",
};

// Firebase 인스턴스 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let memberInfoDocs = await getDocs(collection(db, "member"));
let teamGoalDocs = await getDocs(query(collection(db, "TeamGoal"), orderBy("createdAt")));
let teamRuleDocs = await getDocs(query(collection(db, "TeamRule"), orderBy("createdAt")));

// 파이어베이스의 member를 불러온 뒤 HTML 추가
let teamMemberListHtml = "";
memberInfoDocs.forEach((doc) => {
  let member = doc.data();
  teamMemberListHtml += `
        <div class="col-12 col-sm-6 col-lg-4 col-xl-2 mb-4">
          <div class="card h-100 shadow-sm border-0 rounded-3 text-center team-member-card">
            <img src="${member.img}" alt="${member.name}" class="card-img-top mx-auto mt-3 rounded-circle border border-primary member-card" style="width: 120px; height: 120px; object-fit: cover" />
            <div class="card-body">
              <h5 class="card-title fw-bold text-dark mb-1">${member.name}</h5>
              <p class="card-text text-info">${member.title}</p>
            </div>
          </div>
        </div>
        `;
  $("#homeTeamMembersGrid").html(teamMemberListHtml);
});

// 멤버 카드 클릭시 name 파라미터와 함께 detail.html로 이동
$(".member-card").click((e) => {
  location.href = "detail.html?name=" + e.target.alt;
});

// 목표 리스트 렌더링
teamGoalDocs.forEach((doc) => {
  const id = doc.id;
  const data = doc.data();
  $("#team-goal-list").append(`
  <li class="mb-2 team-info-list" id="${id}">
    <i class="bi bi-check-circle-fill text-success me-2"></i>
    <span>${data.content}</span>
    <div class="action-buttons">
      <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${id}" data-type="TeamGoal">수정</button>
      <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${id}" data-type="TeamGoal">제거</button>
    </div>
  </li>
`);
});

// 약속 리스트 렌더링
teamRuleDocs.forEach((doc) => {
  const id = doc.id;
  const data = doc.data();
  $("#team-rule-list").append(`
  <li class="mb-2 team-info-list" id="${id}">
    <i class="bi bi-hand-thumbs-up-fill text-warning me-2"></i>
    <span>${data.content}</span>
    <div class="action-buttons">
      <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${id}" data-type="TeamRule">수정</button>
      <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${id}" data-type="TeamRule">제거</button>
    </div>
  </li>
`);
});

// 마우스 진입 시 (+) 버튼 보이기
$("#goal-hover-zone").hover(
  () => $("#goal-add-button").removeClass("d-none"),
  () => $("#goal-add-button").addClass("d-none")
);

$("#rule-hover-zone").hover(
  () => $("#rule-add-button").removeClass("d-none"),
  () => $("#rule-add-button").addClass("d-none")
);

// 추가 버튼 클릭 시
$("#goal-add-button").click(async function () {
  const content = prompt("추가할 팀 목표를 입력하세요:");
  if (content) {
    const newDoc = await addDoc(collection(db, "TeamGoal"), {
      content: content,
      createdAt: serverTimestamp(),
    });
    $("#team-goal-list").append(`
    <li class="mb-2 team-info-list" id="${newDoc.id}">
      <i class="bi bi-check-circle-fill text-success me-2"></i>
      <span>${content}</span>
      <div class="action-buttons">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${newDoc.id}" data-type="TeamGoal">수정</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${newDoc.id}" data-type="TeamGoal">제거</button>
      </div>
    </li>
  `);
  }
});

$("#rule-add-button").click(async function () {
  const content = prompt("추가할 팀 약속을 입력하세요:");
  if (content) {
    const newDoc = await addDoc(collection(db, "TeamRule"), {
      content: content,
      createdAt: serverTimestamp(),
    });
    $("#team-rule-list").append(`
    <li class="mb-2 team-info-list" id="${newDoc.id}">
      <i class="bi bi-hand-thumbs-up-fill text-warning me-2"></i>
      <span>${content}</span>
      <div class="action-buttons">
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${newDoc.id}" data-type="TeamRule">수정</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${newDoc.id}" data-type="TeamRule">제거</button>
      </div>
    </li>
  `);
  }
});

// 삭제
$(document).on("click", ".btn-delete", async function () {
  const id = $(this).data("id");
  const type = $(this).data("type");
  await deleteDoc(doc(db, type, id));
  $(`#${id}`).remove();
});

// 수정
$(document).on("click", ".btn-edit", function () {
  const id = $(this).data("id");
  const type = $(this).data("type");
  const currentContent = $(`#${id}`).find("span");

  const updated = prompt("수정할 내용을 입력하세요:", currentContent.html());
  if (updated) {
    updateDoc(doc(db, type, id), { content: updated });
    currentContent.html(updated);
  }
});