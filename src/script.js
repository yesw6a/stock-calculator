/* 设置动态年份 */
document.getElementById('currentYear').textContent = new Date().getFullYear();

/* 禁用双击缩放 */
document.addEventListener(
  'touchstart',
  function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false }
);

let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  function (event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

/** 额外激励 */
export const EXTRA_INCENTIVE = {
  非装维:{
    /** 加装FTTR */
    fttrChecked: 0
  }
};

let startX = 0;
let currentX = 0;
let isDragging = false;
const container = document.querySelector('.calculator-container');
const tabs = document.querySelectorAll('.tab');
const indicator = document.querySelector('.tab-indicator');
const slider = document.querySelector('.content-slider');
let currentTab = 'tiZhi';
let hasCalculatedTiZhi = false;
let hasCalculatedJiaBao = false;

/* 更新tab指示器 */
function updateIndicator() {
  const activeTab = document.querySelector('.tab.active');
  const index = Array.from(tabs).indexOf(activeTab);
  indicator.style.transform = `translateX(${index * 100}%)`;
}

updateIndicator();

/* 切换tab */
function switchTab(tabId) {
  if (currentTab === tabId) return;

  tabs.forEach((tab) => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

  updateIndicator();

  if (tabId === 'jiaBao') {
    slider.classList.add('slide-left');
  } else {
    slider.classList.remove('slide-left');
  }

  currentTab = tabId;
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');
    switchTab(tabId);
  });
});

/* 校验输入 */
function validateInput(value, errorId) {
  const error = document.getElementById(errorId);
  if (isNaN(value) || value < 0) {
    error.style.display = 'block';
    return false;
  }
  error.style.display = 'none';
  return true;
}

function formatNumber(number) {
  return new Intl.NumberFormat('zh-CN').format(number);
}

function calculate(type) {
  if (type === 'tiZhi') {
    calculateTiZhi();
    hasCalculatedTiZhi = true;
  } else {
    calculateJiaBao();
    hasCalculatedJiaBao = true;
  }
}

/* 新套餐佣金计算公式 */
function calculateNewPackageCommission(newPackageValue) {
  return newPackageValue * 3.5;
}

/* 提值计算逻辑 */
function calculateTiZhi() {
  const originPackageInput = document.getElementById('originPackage');
  const packageInput = document.getElementById('package');
  const amountInput = document.getElementById('amount');
  
  /* 检查输入是否为空，并标红提示 */
  let isValid = true;
  
  if (!originPackageInput.value) {
    originPackageInput.classList.add('error-input');
    originPackageInput.setAttribute('placeholder', '请输入原套餐价值');
    isValid = false;
  }
  
  if (!packageInput.value) {
    packageInput.classList.add('error-input');
    packageInput.setAttribute('placeholder', '请输入新套餐价值');
    isValid = false;
  }
  
  if (!isValid) {
    amountInput.value = '';
    return false;
  }
  
  const originPackageValue = parseFloat(originPackageInput.value);
  const packageValue = parseFloat(packageInput.value);
  const amount = packageValue - originPackageValue;
  amountInput.value = isNaN(amount) ? '' : amount;
  const currentRole = document.getElementById('roleSelect').value;

  const isOriginValid = validateInput(originPackageValue, 'originPackage-error');
  const isPackageValid = validateInput(packageValue, 'package-error');
  const isAmountValid = !isNaN(amount) && amount >= 0;
  if (!isOriginValid || !isPackageValid || !isAmountValid) {
    return false;
  }

  const baseMultiplier = amount >= 60 ? 4.5 : 2.5;
  const packageMultiplier = 0.5;

  let commission, commissionWithoutExtra, usedNewPackageCommission = false;
  let extraIncentive = 0;
  if (currentRole === '非装维') {
    const fttrChecked = document.getElementById('fttrCheckbox').checked;
    commissionWithoutExtra = amount * baseMultiplier + packageValue * packageMultiplier;
    const newPackageCommission = calculateNewPackageCommission(packageValue);
    if (commissionWithoutExtra > newPackageCommission) {
      commission = newPackageCommission;
      usedNewPackageCommission = true;
    } else {
      commission = commissionWithoutExtra;
    }
    if (fttrChecked) {
      extraIncentive = EXTRA_INCENTIVE.非装维.fttrChecked;
    }
  } else {
    commissionWithoutExtra = amount * baseMultiplier + packageValue * packageMultiplier;
    const newPackageCommission = calculateNewPackageCommission(packageValue);
    if (commissionWithoutExtra > newPackageCommission) {
      commission = newPackageCommission;
      usedNewPackageCommission = true;
    } else {
      commission = commissionWithoutExtra;
    }
  }

  let multiple;
  let finalCommission = commission + extraIncentive;
  if (usedNewPackageCommission) {
    multiple = commission / amount;
    document.getElementById('result').innerHTML = `${formatNumber(finalCommission.toFixed(1))}<span class=\"max-incentive\">（已达最大激励）</span>`;
  } else {
    multiple = commission / amount;
    document.getElementById('result').textContent = formatNumber(finalCommission.toFixed(1));
  }
  document.getElementById('multiple').textContent = amount > 0 ? `${multiple.toFixed(2)} 倍` : '金额无效';

  document.activeElement.blur();
  return true;
}

/* 加包计算逻辑 */
function calculateJiaBao() {
  const originInput = document.getElementById('jiaBaoOriginPackage');
  const newPackageInput = document.getElementById('newPackage');
  const amountInput = document.getElementById('jiaBaoAmount');
  
  /* 检查输入是否为空，并标红提示 */
  let isValid = true;
  
  if (!originInput.value) {
    originInput.classList.add('error-input');
    originInput.setAttribute('placeholder', '请输入原套餐价值');
    isValid = false;
  }
  
  if (!newPackageInput.value) {
    newPackageInput.classList.add('error-input');
    newPackageInput.setAttribute('placeholder', '请输入新套餐价值');
    isValid = false;
  }
  
  if (!isValid) {
    amountInput.value = '';
    return false;
  }
  
  const originValue = parseFloat(originInput.value);
  const newPackageValue = parseFloat(newPackageInput.value);
  const amount = newPackageValue - originValue;
  amountInput.value = isNaN(amount) ? '' : amount;
  const currentRole = document.getElementById('roleSelect').value;

  const isOriginValid = validateInput(originValue, 'jiaBaoOriginPackage-error');
  const isNewPackageValid = validateInput(newPackageValue, 'newPackage-error');
  const isAmountValid = !isNaN(amount) && amount >= 0;
  if (!isOriginValid || !isNewPackageValid || !isAmountValid) {
    return false;
  }

  const baseMultiplier = amount >= 60 ? 4 : 2;
  const packageMultiplier = 0.25;

  let commission, commissionWithoutExtra, usedNewPackageCommission = false;
  let extraIncentive = 0;
  if (currentRole === '非装维') {
    const fttrChecked = document.getElementById('fttrCheckboxJiaBao').checked;
    commissionWithoutExtra = amount * baseMultiplier + newPackageValue * packageMultiplier;
    const newPackageCommission = calculateNewPackageCommission(newPackageValue);
    if (commissionWithoutExtra > newPackageCommission) {
      commission = newPackageCommission;
      usedNewPackageCommission = true;
    } else {
      commission = commissionWithoutExtra;
    }
    if (fttrChecked) {
      extraIncentive = EXTRA_INCENTIVE.非装维.fttrChecked;
    }
  } else {
    commissionWithoutExtra = amount * baseMultiplier + newPackageValue * packageMultiplier;
    const newPackageCommission = calculateNewPackageCommission(newPackageValue);
    if (commissionWithoutExtra > newPackageCommission) {
      commission = newPackageCommission;
      usedNewPackageCommission = true;
    } else {
      commission = commissionWithoutExtra;
    }
  }

  let multiple;
  let finalCommission = commission + extraIncentive;
  if (usedNewPackageCommission) {
    multiple = commission / amount;
    document.getElementById('resultJiaBao').innerHTML = `${formatNumber(finalCommission.toFixed(1))}<span class=\"max-incentive\">（已达最大激励）</span>`;
  } else {
    multiple = commission / amount;
    document.getElementById('resultJiaBao').textContent = formatNumber(finalCommission.toFixed(1));
  }
  document.getElementById('multipleJiaBao').textContent = amount > 0 ? `${multiple.toFixed(2)} 倍` : '金额无效';

  document.activeElement.blur();
  return true;
}

/* 添加输入事件监听器 */
['originPackage', 'package'].forEach((id) => {
  const input = document.getElementById(id);
  let originalPlaceholder = input.getAttribute('placeholder');
  if (id === 'package') {
    originalPlaceholder = '请输入新套餐价值';
  }
  if (id === 'originPackage') {
    originalPlaceholder = '请输入原套餐价值';
  }
  input.addEventListener('input', function () {
    /* 当用户开始输入时，清除错误状态 */
    if (this.value) {
      this.classList.remove('error-input');
      /* 恢复原始placeholder */
      this.setAttribute('placeholder', originalPlaceholder);
    }
    // 只自动计算提值金额，不自动算佣金
    const originPackageInput = document.getElementById('originPackage');
    const packageInput = document.getElementById('package');
    const amountInput = document.getElementById('amount');
    const originPackageValue = parseFloat(originPackageInput.value);
    const packageValue = parseFloat(packageInput.value);
    const amount = packageValue - originPackageValue;
    amountInput.value = isNaN(amount) ? '' : amount;
  });

  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      calculate('tiZhi');
    }
  });
  
  /* 添加焦点事件 */
  input.addEventListener('focus', function() {
    this.classList.add('focused');
    /* 聚焦时也清除错误状态 */
    if (this.value) {
      this.classList.remove('error-input');
      this.setAttribute('placeholder', originalPlaceholder);
    }
  });
  
  input.addEventListener('blur', function() {
    this.classList.remove('focused');
  });
});

/* 加包计算器的输入监听 */
['jiaBaoOriginPackage', 'newPackage'].forEach((id) => {
  const input = document.getElementById(id);
  let originalPlaceholder = input.getAttribute('placeholder');
  if (id === 'newPackage') {
    originalPlaceholder = '请输入新套餐价值';
  }
  if (id === 'jiaBaoOriginPackage') {
    originalPlaceholder = '请输入原套餐价值';
  }
  input.addEventListener('input', function () {
    /* 当用户开始输入时，清除错误状态 */
    if (this.value) {
      this.classList.remove('error-input');
      /* 恢复原始placeholder */
      this.setAttribute('placeholder', originalPlaceholder);
    }
    // 只自动计算提值金额，不自动算佣金
    const originInput = document.getElementById('jiaBaoOriginPackage');
    const newPackageInput = document.getElementById('newPackage');
    const amountInput = document.getElementById('jiaBaoAmount');
    const originValue = parseFloat(originInput.value);
    const newPackageValue = parseFloat(newPackageInput.value);
    const amount = newPackageValue - originValue;
    amountInput.value = isNaN(amount) ? '' : amount;
  });

  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      calculate('jiaBao');
    }
  });
  
  /* 添加焦点事件 */
  input.addEventListener('focus', function() {
    this.classList.add('focused');
    /* 聚焦时也清除错误状态 */
    if (this.value) {
      this.classList.remove('error-input');
      this.setAttribute('placeholder', originalPlaceholder);
    }
  });
  
  input.addEventListener('blur', function() {
    this.classList.remove('focused');
  });
});

/* 优化移动端点击延迟 */
document.getElementById('calcButton').addEventListener('click', function () {
  calculate('tiZhi');
});

document.getElementById('calcButtonJiaBao').addEventListener('click', function () {
  calculate('jiaBao');
});

document.getElementById('calcButton').addEventListener('touchstart', function (e) {
  e.preventDefault();
  calculate('tiZhi');
});

document.getElementById('calcButtonJiaBao').addEventListener('touchstart', function (e) {
  e.preventDefault();
  calculate('jiaBao');
});

/* 角色选择和持久化 */
const roleSelect = document.getElementById('roleSelect');

/* 从localStorage加载保存的角色 */
const savedRole = localStorage.getItem('selectedRole');
if (savedRole) {
  roleSelect.value = savedRole;
}

/* 从localStorage加载FTTR勾选状态 */
const fttrCheckbox = document.getElementById('fttrCheckbox');
const fttrCheckboxJiaBao = document.getElementById('fttrCheckboxJiaBao');
const fttrOption = document.getElementById('fttrOption');
const fttrOptionJiaBao = document.getElementById('fttrOptionJiaBao');

/* 默认勾选 */
fttrCheckbox.checked = true;
fttrCheckboxJiaBao.checked = true;
fttrOption.classList.add('checked');
fttrOptionJiaBao.classList.add('checked');

/* 更新提示信息显示状态和内容 */
function updateTipVisibility() {
  const currentRole = document.getElementById('roleSelect').value;
  const tiZhiTip = document.getElementById('tiZhiTip');
  const jiaBaoTip = document.getElementById('jiaBaoTip');

  if (currentRole === '装维') {
    tiZhiTip.textContent = '已包含达量1倍激励';
    jiaBaoTip.textContent = '已包含达量1倍激励';
    tiZhiTip.classList.remove('show');
    jiaBaoTip.classList.remove('show');
    fttrOption.style.display = 'none';
    fttrOptionJiaBao.style.display = 'none';
  } else {
    const fttrChecked = document.getElementById('fttrCheckbox').checked;
    const fttrCheckedJiaBao = document.getElementById('fttrCheckboxJiaBao').checked;
    
    // 根据FTTR激励值决定是否显示FTTR选项
    if (EXTRA_INCENTIVE.非装维.fttrChecked > 0) {
      fttrOption.style.display = 'flex';
      fttrOptionJiaBao.style.display = 'flex';
      
      if (fttrChecked) {
        tiZhiTip.textContent = `已包含${EXTRA_INCENTIVE.非装维.fttrChecked}元FTTR激励`;
        tiZhiTip.classList.add('show');
      } else {
        tiZhiTip.classList.remove('show');
      }

      if (fttrCheckedJiaBao) {
        jiaBaoTip.textContent = `已包含${EXTRA_INCENTIVE.非装维.fttrChecked}元FTTR激励`;
        jiaBaoTip.classList.add('show');
      } else {
        jiaBaoTip.classList.remove('show');
      }
    } else {
      // 如果FTTR激励值为0，隐藏FTTR选项
      fttrOption.style.display = 'none';
      fttrOptionJiaBao.style.display = 'none';
      tiZhiTip.classList.remove('show');
      jiaBaoTip.classList.remove('show');
    }
  }
}

/* 初始化时更新提示 */
updateTipVisibility();

/* 角色选择变化时更新提示和重新计算 */
roleSelect.addEventListener('change', function () {
  localStorage.setItem('selectedRole', this.value);
  updateTipVisibility();
  /* 获取当前激活的标签页 */
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
  /* 只在已经进行过计算时才重新计算 */
  if (activeTab === 'tiZhi') {
    if (hasCalculatedTiZhi) {
      calculateTiZhi();
    }
  } else {
    if (hasCalculatedJiaBao) {
      calculateJiaBao();
    }
  }
});

/* FTTR勾选框变化事件 */
fttrCheckbox.addEventListener('change', function () {
  /* 更新选中态样式 */
  if (this.checked) {
    fttrOption.classList.add('checked');
  } else {
    fttrOption.classList.remove('checked');
  }
  
  updateTipVisibility();
  /* 只在已经进行过计算时才重新计算 */
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
  if (activeTab === 'tiZhi') {
    if (hasCalculatedTiZhi) {
      calculateTiZhi();
    }
  }
});

/* 加包计算器FTTR勾选框变化事件 */
fttrCheckboxJiaBao.addEventListener('change', function () {
  /* 更新选中态样式 */
  if (this.checked) {
    fttrOptionJiaBao.classList.add('checked');
  } else {
    fttrOptionJiaBao.classList.remove('checked');
  }
  
  updateTipVisibility();
  /* 只在已经进行过计算时才重新计算 */
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
  if (activeTab === 'jiaBao') {
    if (hasCalculatedJiaBao) {
      calculateJiaBao();
    }
  }
});

/* 添加涟漪效果 */
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();

  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;

  ripple.classList.add('ripple');

  const rippleContainer = button.getElementsByClassName('ripple')[0];

  if (rippleContainer) {
    rippleContainer.remove();
  }

  button.appendChild(ripple);
}

/* 为所有按钮添加涟漪效果 */
const buttons = document.getElementsByTagName('button');
for (const button of buttons) {
  button.addEventListener('click', createRipple);
}

/* 为FTTR选项标签添加涟漪效果 */
const fttrLabels = document.querySelectorAll('.fttr-option');
fttrLabels.forEach((label) => {
  label.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();

    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - radius}px`;
    ripple.style.top = `${e.clientY - rect.top - radius}px`;

    ripple.classList.add('ripple');

    const rippleContainer = this.getElementsByClassName('ripple')[0];

    if (rippleContainer) {
      rippleContainer.remove();
    }

    this.appendChild(ripple);

    /* 300ms后移除涟漪效果 */
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});
