const defaultFoldLineLimit = 30;
const input = document.querySelector("#fold-line-limit");

const save = () => {
  const foldLineLimit = Math.max(1, Number.parseInt(input.value, 10) || defaultFoldLineLimit);
  input.value = foldLineLimit;
  chrome.storage.sync.set({ foldLineLimit });
};

chrome.storage.sync.get({ foldLineLimit: defaultFoldLineLimit }, ({ foldLineLimit }) => {
  input.value = foldLineLimit;
});

input.addEventListener("change", save);
