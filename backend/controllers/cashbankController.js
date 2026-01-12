import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Get all bank accounts for the user
 * @route GET /api/cashbank/accounts
 */
export const getAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.user._id });

    // Decrypt account numbers for response
    const accountsWithDecrypted = accounts.map(account => ({
      ...account.toObject(),
      accountNumber: account.getDecryptedAccountNumber()
    }));

    res.status(200).json(accountsWithDecrypted);
  } catch (err) {
    error(`Get Accounts Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create new bank account
 * @route POST /api/cashbank/accounts
 */
//xcvxdfgdf
export const createAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountType, branch, ifsc, openingBalance } = req.body;

    if (!bankName || !accountNumber || !ifsc) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Check if account already exists for this user
    const existing = await BankAccount.findOne({ accountNumber: req.body.accountNumber, userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "Account already exists" });
    }

    const account = await BankAccount.create({
      bankName,
      accountNumber,
      accountType,
      branch,
      ifsc,
      openingBalance,
      currentBalance: openingBalance,
      userId: req.user._id,
    });

    info(`Bank account added by ${req.user.name}: ${account.bankName}`);

    // Return with decrypted account number
    const responseAccount = {
      ...account.toObject(),
      accountNumber: account.getDecryptedAccountNumber()
    };

    res.status(201).json(responseAccount);
  } catch (err) {
    error(`Create Account Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update bank account
 * @route PUT /api/cashbank/accounts/:id
 */
export const updateAccount = async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, userId: req.user._id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const updates = req.body;
    // Prevent updating balances directly (should be via transactions)
    delete updates.currentBalance;

    Object.assign(account, updates);
    await account.save();

    info(`Bank account updated by ${req.user.name}: ${account.bankName}`);

    // Return with decrypted account number
    const responseAccount = {
      ...account.toObject(),
      accountNumber: account.getDecryptedAccountNumber()
    };

    res.status(200).json(responseAccount);
  } catch (err) {
    error(`Update Account Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete bank account
 * @route DELETE /api/cashbank/accounts/:id
 */
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if account has transactions
    const transactionCount = await CashbankTransaction.countDocuments({
      $or: [
        { fromAccount: id },
        { toAccount: id }
      ]
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        message: `Cannot delete bank account with existing transactions (${transactionCount}). Please delete or clear transactions first to maintain data integrity.`
      });
    }

    const account = await BankAccount.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    info(`Bank account deleted by ${req.user.name}: ${account.bankName}`);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    error(`Delete Account Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get transactions for a specific account
 * @route GET /api/cashbank/accounts/:id/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const transactions = await CashbankTransaction.find({
      userId: req.user._id,
      $or: [{ fromAccount: req.params.id }, { toAccount: req.params.id }]
    }).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (err) {
    error(`Get Transactions Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create a transfer transaction
 * @route POST /api/cashbank/transfers
 */
export const createTransfer = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, description } = req.body;
    console.log('Transfer request:', { fromAccount, toAccount, amount, description });

    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({ message: "Please provide from account, to account, and amount" });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({ message: "Source and destination cannot be the same" });
    }

    // Check balances if transferring from bank account OR cash
    if (fromAccount !== 'cash') {
      const fromAcc = await BankAccount.findOne({ _id: fromAccount, userId: req.user._id });
      if (!fromAcc) {
        return res.status(404).json({ message: "Source account not found" });
      }
      if (fromAcc.currentBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance in source account" });
      }
    } else {
      // Check cash balance
      const cashIn = await CashbankTransaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user._id),
            toAccount: 'cash'
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const cashOut = await CashbankTransaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user._id),
            fromAccount: 'cash'
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const cashInHand = (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);

      if (cashInHand < amount) {
        return res.status(400).json({
          message: `Insufficient cash in hand. Available: ₹${cashInHand.toFixed(2)}`
        });
      }
    }

    // Create transaction first
    const transaction = await CashbankTransaction.create({
      type: 'transfer',
      amount,
      fromAccount,
      toAccount,
      description: description || '',
      userId: req.user._id,
    });

    const transactionId = transaction._id;

    // Update balances
    if (fromAccount !== 'cash') {
      await BankAccount.findByIdAndUpdate(fromAccount, {
        $inc: { currentBalance: -amount },
        $push: { transactions: transactionId }
      });
    }

    if (toAccount !== 'cash') {
      await BankAccount.findByIdAndUpdate(toAccount, {
        $inc: { currentBalance: amount },
        $push: { transactions: transactionId }
      });
    }

    info(`Transfer created by ${req.user.name}: ${amount} from ${fromAccount} to ${toAccount}`);
    console.log('Transfer successful, transaction ID:', transactionId);

    res.status(201).json(transaction);
  } catch (err) {
    error(`Create Transfer Error: ${err.message}`);
    console.error('Transfer error:', err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create a direct cash transaction (In/Out)
 * @route POST /api/cashbank/cash-transactions
 */
export const createCashTransaction = async (req, res) => {
  try {
    const { type, amount, otherAccount, description, reference, date } = req.body;

    if (!type || !amount || !otherAccount) {
      return res.status(400).json({ message: "Type, amount, and category/account are required" });
    }

    let fromAccount, toAccount;
    if (type === 'in') {
      fromAccount = otherAccount; // This can be a category name or a Bank ID
      toAccount = 'cash';
    } else {
      fromAccount = 'cash';
      toAccount = otherAccount; // This can be a category name or a Bank ID
    }

    // If otherAccount is a valid Bank ID, we handle it as a transfer
    const isBankTransfer = mongoose.Types.ObjectId.isValid(otherAccount);

    if (isBankTransfer) {
      // Check balances if transferring FROM a bank
      if (type === 'in') { // Bank -> Cash (Withdrawal)
        const bankAcc = await BankAccount.findOne({ _id: otherAccount, userId: req.user._id });
        if (!bankAcc) return res.status(404).json({ message: "Source bank account not found" });
        if (bankAcc.currentBalance < amount) {
          return res.status(400).json({ message: `Insufficient bank balance. Available: ₹${bankAcc.currentBalance}` });
        }
      } else { // Cash -> Bank (Deposit)
        // Validation for cash balance already calculated in similar way in position API
        const cashIn = await CashbankTransaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(req.user._id), toAccount: 'cash' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashOut = await CashbankTransaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(req.user._id), fromAccount: 'cash' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashInHand = (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);

        if (cashInHand < amount) {
          return res.status(400).json({ message: `Insufficient cash in hand. Available: ₹${cashInHand.toFixed(2)}` });
        }
      }
    }

    // Create the transaction
    const transaction = await CashbankTransaction.create({
      type: isBankTransfer ? 'transfer' : type,
      amount,
      fromAccount,
      toAccount,
      description: description || '',
      reference: reference || '',
      date: date || new Date(),
      userId: req.user._id,
    });

    // Update bank balance if it's a transfer
    if (isBankTransfer) {
      if (type === 'in') { // Bank -> Cash (Withdrawal)
        await BankAccount.findByIdAndUpdate(otherAccount, {
          $inc: { currentBalance: -amount },
          $push: { transactions: transaction._id }
        });
      } else { // Cash -> Bank (Deposit)
        await BankAccount.findByIdAndUpdate(otherAccount, {
          $inc: { currentBalance: amount },
          $push: { transactions: transaction._id }
        });
      }
    }

    info(`Cash ${type} recorded by ${req.user.name}: ${amount} - ${description}`);
    res.status(201).json(transaction);
  } catch (err) {
    error(`Create Cash Transaction Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get account ledger with running balance
 * @route GET /api/cashbank/accounts/:id/ledger
 */
export const getAccountLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reconciled } = req.query;

    // Build query
    const query = {
      userId: req.user._id,
      $or: [
        { fromAccount: id },
        { toAccount: id }
      ]
    };

    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Reconciliation filter
    if (reconciled !== undefined) {
      query.reconciled = reconciled === 'true';
    }

    // Get account for opening balance
    let account;
    if (id === 'cash') {
      // For cash, we calculate dynamic balance
      const cashIn = await CashbankTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user._id), toAccount: 'cash' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const cashOut = await CashbankTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user._id), fromAccount: 'cash' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const balance = (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);

      account = {
        _id: 'cash',
        bankName: 'Cash in Hand',
        accountNumber: 'CASH-ACCOUNT',
        accountType: 'Cash',
        openingBalance: 0,
        currentBalance: balance,
        getDecryptedAccountNumber: () => 'CASH-ACCOUNT'
      };
    } else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Account ID' });
      }
      account = await BankAccount.findOne({
        _id: id,
        userId: req.user._id
      });
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get opening balance for the period
    let periodOpeningBalance = account.openingBalance || 0;

    // If there's a startDate, calculate balance of all transactions before it
    if (startDate) {
      const priorTransactions = await CashbankTransaction.find({
        userId: req.user._id,
        date: { $lt: new Date(startDate) },
        $or: [
          { fromAccount: id },
          { toAccount: id }
        ]
      }).lean();

      priorTransactions.forEach(txn => {
        const isMoneyIn = txn.toAccount.toString() === id;
        periodOpeningBalance += isMoneyIn ? txn.amount : -txn.amount;
      });
    }

    // Get transactions for the period
    const transactions = await CashbankTransaction.find(query)
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // Calculate running balance starting from the period opening balance
    let runningBalance = periodOpeningBalance;
    const ledger = transactions.map(txn => {
      // Determine if money in or out
      const isCredit = txn.toAccount.toString() === id;
      const amount = isCredit ? txn.amount : -txn.amount;

      runningBalance += amount;

      return {
        ...txn,
        debit: !isCredit ? txn.amount : 0,
        credit: isCredit ? txn.amount : 0,
        runningBalance,
        transactionType: isCredit ? 'credit' : 'debit'
      };
    });

    res.status(200).json({
      account: {
        _id: account._id,
        bankName: account.bankName,
        accountNumber: account.getDecryptedAccountNumber(),
        accountType: account.accountType,
        openingBalance: account.openingBalance,
        currentBalance: account.currentBalance
      },
      ledger,
      summary: {
        openingBalance: periodOpeningBalance,
        totalCredits: ledger.reduce((sum, t) => sum + t.credit, 0),
        totalDebits: ledger.reduce((sum, t) => sum + t.debit, 0),
        closingBalance: runningBalance
      }
    });
  } catch (err) {
    error(`Get account ledger failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/**
 * @desc Toggle reconciliation status
 * @route PUT /api/cashbank/transactions/:id/reconcile
 */
export const toggleReconciliation = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await CashbankTransaction.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.reconciled = !transaction.reconciled;
    transaction.reconciledDate = transaction.reconciled ? new Date() : null;
    transaction.reconciledBy = transaction.reconciled ? req.user._id : null;

    await transaction.save();

    info(`Transaction ${transaction.reconciled ? 'reconciled' : 'unreconciled'} by ${req.user.name}`);

    res.status(200).json({
      message: `Transaction marked as ${transaction.reconciled ? 'reconciled' : 'unreconciled'}`,
      transaction
    });
  } catch (err) {
    error(`Toggle reconciliation failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/**
 * @desc Reconcile multiple transactions
 * @route PUT /api/cashbank/transactions/bulk-reconcile
 */
export const bulkReconcile = async (req, res) => {
  try {
    const { transactionIds, reconciled } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({ message: 'Transaction IDs array required' });
    }

    const result = await CashbankTransaction.updateMany(
      {
        _id: { $in: transactionIds },
        userId: req.user._id
      },
      {
        $set: {
          reconciled,
          reconciledDate: reconciled ? new Date() : null,
          reconciledBy: reconciled ? req.user._id : null
        }
      }
    );

    info(`Bulk reconcile by ${req.user.name}: ${result.modifiedCount} transactions`);

    res.status(200).json({
      message: `${result.modifiedCount} transactions updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    error(`Bulk reconcile failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/**
 * @desc Get bank-wise balance summary
 * @route GET /api/cashbank/summary
 */
export const getBankSummary = async (req, res) => {
  try {
    const accounts = await BankAccount.find({
      userId: req.user._id
    }).sort({ bankName: 1 });

    const summary = accounts.map(acc => ({
      _id: acc._id,
      bankName: acc.bankName,
      accountType: acc.accountType,
      accountNumber: acc.getDecryptedAccountNumber(),
      openingBalance: acc.openingBalance,
      currentBalance: acc.currentBalance,
      status: acc.status || 'active'
    }));

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    res.status(200).json({
      accounts: summary,
      totalBalance,
      accountCount: accounts.length
    });
  } catch (err) {
    error(`Get bank summary failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/**
 * @desc Get cash vs bank position
 * @route GET /api/cashbank/position
 */
export const getCashBankPosition = async (req, res) => {
  try {
    // Get total bank balances
    const bankAccounts = await BankAccount.find({
      userId: req.user._id
    });

    const totalBankBalance = bankAccounts.reduce(
      (sum, acc) => sum + acc.currentBalance,
      0
    );

    // Calculate cash in hand
    const cashIn = await CashbankTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          toAccount: 'cash'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const cashOut = await CashbankTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          fromAccount: 'cash'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const cashInHand = (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    const totalLiquidity = cashInHand + totalBankBalance;

    res.status(200).json({
      cashInHand,
      totalBankBalance,
      totalLiquidity,
      breakdown: {
        cash: {
          amount: cashInHand,
          percentage: totalLiquidity > 0 ? ((cashInHand / totalLiquidity) * 100).toFixed(2) : 0
        },
        bank: {
          amount: totalBankBalance,
          percentage: totalLiquidity > 0 ? ((totalBankBalance / totalLiquidity) * 100).toFixed(2) : 0,
          accounts: bankAccounts.length
        }
      }
    });
  } catch (err) {
    error(`Get cash/bank position failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

/**
 * @desc Export transactions for date range
 * @route GET /api/cashbank/export
 */
export const exportStatement = async (req, res) => {
  try {
    const { startDate, endDate, accountId, format } = req.query;

    const query = { userId: req.user._id };

    // Date filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Account filter
    if (accountId) {
      query.$or = [
        { fromAccount: accountId },
        { toAccount: accountId }
      ];
    }

    const transactions = await CashbankTransaction.find(query)
      .sort({ date: -1 })
      .lean();

    // If CSV format requested
    if (format === 'csv') {
      const headers = ['Date', 'Type', 'From', 'To', 'Amount', 'Description', 'Reconciled', 'Reference'];
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.fromAccount || 'N/A',
        t.toAccount || 'N/A',
        t.amount,
        t.description || '',
        t.reconciled ? 'Yes' : 'No',
        t.reference || ''
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=statement.csv');
      return res.send(csv);
    }

    res.status(200).json({
      transactions,
      count: transactions.length,
      dateRange: { startDate, endDate }
    });
  } catch (err) {
    error(`Export statement failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};