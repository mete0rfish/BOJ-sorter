// =================================================================================
// 전역 변수 및 페이지 감지
// =================================================================================
const isWorkbookPage = window.location.href.includes('/workbook/view/');
const isBoardPage = window.location.href.includes('/board/');
const headers = document.querySelectorAll('.table-responsive thead th');

// =================================================================================
// 공통 함수
// =================================================================================

/**
 * 모든 헤더와 추가 기능 버튼의 정렬 상태를 초기화하는 함수
 */
function resetAllSortStates() {
  headers.forEach(h => {
    h.dataset.sortOrder = 'none';
    h.classList.remove('sorted-asc', 'sorted-desc');
  });
  // 각 페이지별 추가 버튼 상태도 초기화
  const tierSortButton = document.querySelector('.tier-sort-button');
  if (tierSortButton) {
    tierSortButton.textContent = '티어 정렬';
    tierSortButton.dataset.sortOrder = 'none';
  }
  const solvedSortButton = document.querySelector('.solved-sort-button');
  if (solvedSortButton) {
    solvedSortButton.textContent = '해결순 정렬';
    solvedSortButton.dataset.sortOrder = 'none';
  }
}

// =================================================================================
// 페이지별 기능 실행
// =================================================================================

if (headers.length > 0) {
  // 1. 모든 헤더에 기본 정렬 기능 추가
  headers.forEach((header, index) => {
    header.classList.add('sortable');
    header.addEventListener('click', () => {
      const tbody = document.querySelector('.table-responsive tbody');
      if (!tbody) return;

      const rowsSelector = isBoardPage ? 'tr:not(.success)' : 'tr';
      const rows = Array.from(tbody.querySelectorAll(rowsSelector));

      const currentOrder = header.dataset.sortOrder;
      const newOrder = (currentOrder === 'asc') ? 'desc' : 'asc';

      // === 로직 수정: 상태 초기화를 가장 먼저 실행 ===
      resetAllSortStates();

      // 초기화 후, 현재 클릭된 헤더에만 새로운 상태 적용
      header.dataset.sortOrder = newOrder;
      header.classList.add(newOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');

      rows.sort((rowA, rowB) => {
        if (isWorkbookPage) return compareWorkbookRows(rowA, rowB, index, newOrder);
        if (isBoardPage) return compareBoardRows(rowA, rowB, index, newOrder);
        return 0;
      });

      rows.forEach(row => tbody.appendChild(row));
    });
  });

  // 2. 페이지에 맞는 추가 기능 실행
  if (isWorkbookPage) {
    addTierSortButton();
  }
  if (isBoardPage) {
    addSolvedSortButton();
  }
}

// =================================================================================
// 문제집 페이지 전용 함수
// =================================================================================

function addTierSortButton() {
  const titleHeader = headers[1];
  if (!titleHeader) return;

  const button = document.createElement('span');
  button.className = 'tier-sort-button';
  button.textContent = '티어 정렬';
  button.dataset.sortOrder = 'none';
  titleHeader.appendChild(button);

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const tbody = document.querySelector('.table-responsive tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const currentOrder = button.dataset.sortOrder;
    const newOrder = (currentOrder === 'desc') ? 'asc' : 'desc';

    // === 로직 수정: 상태 초기화를 가장 먼저 실행 ===
    resetAllSortStates();

    // 초기화 후, 현재 클릭된 버튼에만 새로운 상태 적용
    button.dataset.sortOrder = newOrder;
    button.textContent = `티어 정렬 ${newOrder === 'asc' ? '▲' : '▼'}`;

    const getTier = (row) => {
      const img = row.querySelector('td:nth-child(2) .solvedac-tier');
      if (!img) return 0;
      const match = img.src.match(/(\d+)\.svg$/);
      return match ? parseInt(match[1], 10) : 0;
    };
    rows.sort((a, b) => newOrder === 'desc' ? getTier(b) - getTier(a) : getTier(a) - getTier(b));
    rows.forEach(row => tbody.appendChild(row));
  });
}

function compareWorkbookRows(rowA, rowB, index, order) {
  const cellA = rowA.children[index].innerText;
  const cellB = rowB.children[index].innerText;
  if ([0, 3, 4, 5].includes(index)) {
    const numA = parseFloat(cellA.replace(/[^0-9.-]+/g, ""));
    const numB = parseFloat(cellB.replace(/[^0-9.-]+/g, ""));
    return order === 'asc' ? numA - numB : numB - numA;
  } else {
    return order === 'asc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
  }
}

// =================================================================================
// 게시판 페이지 전용 함수
// =================================================================================

function addSolvedSortButton() {
  const titleHeader = headers[0];
  if (!titleHeader) return;

  const button = document.createElement('span');
  button.className = 'solved-sort-button';
  button.textContent = '해결순 정렬';
  button.dataset.sortOrder = 'none';
  titleHeader.appendChild(button);

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const tbody = document.querySelector('.table-responsive tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.success)'));

    const currentOrder = button.dataset.sortOrder;
    const newOrder = (currentOrder === 'desc') ? 'asc' : 'desc';

    // === 로직 수정: 상태 초기화를 가장 먼저 실행 ===
    resetAllSortStates();

    // 초기화 후, 현재 클릭된 버튼에만 새로운 상태 적용
    button.dataset.sortOrder = newOrder;
    button.textContent = `해결순 정렬 ${newOrder === 'asc' ? '▲' : '▼'}`;

    const isSolved = (row) => row.children[0].querySelector('.label-success') !== null;

    rows.sort((a, b) => {
        const solvedA = isSolved(a);
        const solvedB = isSolved(b);
        if (solvedA === solvedB) return 0;
        const comparison = solvedA - solvedB;
        return newOrder === 'asc' ? comparison : -comparison;
    });
    rows.forEach(row => tbody.appendChild(row));
  });
}

function compareBoardRows(rowA, rowB, index, order) {
  const cellA = rowA.children[index];
  const cellB = rowB.children[index];

  if (index === 6) { // 작성일
    const timeA = parseInt(cellA.querySelector('a')?.dataset.timestamp || '0', 10);
    const timeB = parseInt(cellB.querySelector('a')?.dataset.timestamp || '0', 10);
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  }
  if ([4, 5].includes(index)) { // 댓글, 좋아요
    const numA = parseInt(cellA.innerText.trim() || '0', 10);
    const numB = parseInt(cellB.innerText.trim() || '0', 10);
    return order === 'asc' ? numA - numB : numB - numA;
  }
  // 나머지
  const textA = cellA.innerText.trim();
  const textB = cellB.innerText.trim();
  return order === 'asc' ? textA.localeCompare(textB) : textB.localeCompare(textA);
}